import React, { useState, useEffect, useRef } from 'react';

interface EquipmentStat {
    attribute: string;
    value: number;
}

interface AffixDetail {
    position: 'prefix' | 'suffix';
    tier: number;
    name: string;
    description: string;
    range?: string;
}

interface ExternalRewardItem {
    name: string;
    type: string;
    icon: string;
    stats: EquipmentStat[];
    rarity?: number;
    affixDetails?: AffixDetail[];
    baseStats?: string;
    forgeLevel?: number;
    limitSlot?: string;
}

interface VaultUIProps {
    visible: boolean;
    onClose: () => void;
}

const safeStr = (v: any, d: string = ''): string => (v == null ? d : String(v));
const safeNum = (v: any, d: number = 0): number => { const n = Number(v); return isNaN(n) ? d : n; };

const QUALITY_COLORS: Record<number, string> = {
    0: '#c8c8c8',
    1: '#8888ff',
    2: '#ffff77',
    3: '#ff8800',
};

const QUALITY_NAMES: Record<number, string> = {
    0: 'Common',
    1: 'Magic',
    2: 'Rare',
    3: 'Legendary',
};

export const VaultUI: React.FC<VaultUIProps> = ({ visible, onClose }) => {
    const [vaultItems, setVaultItems] = useState<ExternalRewardItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<number | null>(null);
    const [equippedItems, setEquippedItems] = useState<Record<string, ExternalRewardItem | null>>({});
    const [isEquipping, setIsEquipping] = useState(false);
    
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const hoverTimeoutRef = useRef<ScheduleID | null>(null);
    const isHoveringPanelRef = useRef(false);

    const equipTimeoutRef = useRef<ScheduleID | null>(null);
    const mountedRef = useRef(true);
    
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (equipTimeoutRef.current) $.CancelScheduled(equipTimeoutRef.current);
            if (hoverTimeoutRef.current) $.CancelScheduled(hoverTimeoutRef.current);
        };
    }, []);
    
    const extractAffixes = (affixDetails: any) => {
        const prefixes: AffixDetail[] = [];
        const suffixes: AffixDetail[] = [];
        if (! affixDetails) return { prefixes, suffixes };
        
        try {
            for (const key in affixDetails) {
                const a = affixDetails[key];
                if (a && typeof a === 'object' && a.name) {
                    const safe: AffixDetail = {
                        position: a.position || 'prefix',
                        tier: safeNum(a.tier, 1),
                        name: safeStr(a.name),
                        description: safeStr(a.description),
                        range: a.range ?  safeStr(a.range) : undefined,
                    };
                    if (safe.position === 'prefix') prefixes.push(safe);
                    else suffixes.push(safe);
                }
            }
        } catch (e) {}
        return { prefixes, suffixes };
    };

    const getColor = (item: ExternalRewardItem | null): string => {
        if (!item) return '#9d9d9d';
        if (item.rarity != null) {
            return QUALITY_COLORS[item.rarity] || '#9d9d9d';
        }
        return '#9d9d9d';
    };

    const findEquipped = (type: string): ExternalRewardItem | null => {
        if (!type) return null;
        for (const slot in equippedItems) {
            if (equippedItems[slot]?.type === type) return equippedItems[slot];
        }
        return null;
    };

    const onItemMouseOver = (idx: number) => {
        if (hoverTimeoutRef.current) {
            $.CancelScheduled(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        
        hoverTimeoutRef.current = $.Schedule(0.03, () => {
            if (mountedRef.current && selectedItem === null) {
                setHoverIndex(idx);
            }
            hoverTimeoutRef.current = null;
        });
    };

    const onItemMouseOut = () => {
        if (hoverTimeoutRef.current) {
            $.CancelScheduled(hoverTimeoutRef.current);
        }
        
        hoverTimeoutRef.current = $.Schedule(0.25, () => {
            if (mountedRef.current && ! isHoveringPanelRef.current) {
                setHoverIndex(null);
            }
            hoverTimeoutRef.current = null;
        });
    };

    const onHoverPanelMouseOver = () => {
        isHoveringPanelRef.current = true;
        if (hoverTimeoutRef.current) {
            $.CancelScheduled(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    const onHoverPanelMouseOut = () => {
        isHoveringPanelRef.current = false;
        if (hoverTimeoutRef.current) {
            $.CancelScheduled(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = $.Schedule(0.2, () => {
            if (mountedRef.current && !isHoveringPanelRef.current) {
                setHoverIndex(null);
            }
            hoverTimeoutRef.current = null;
        });
    };
    
    useEffect(() => {
        if (!visible) return;
        
        let active = true;

        (GameEvents.SendCustomGameEventToServer as any)('request_vault_data', { PlayerID: Players.GetLocalPlayer() });
        (GameEvents.SendCustomGameEventToServer as any)('request_equipment_data', { PlayerID: Players.GetLocalPlayer() });

        const h1 = GameEvents.Subscribe('update_vault_ui', (data: any) => {
            if (! active || !mountedRef.current) return;
            try {
                const items: ExternalRewardItem[] = [];
                if (data?.items) {
                    const arr = Array.isArray(data.items) ? data.items : Object.values(data.items);
                    for (const item of arr) {
                        if (item && typeof item === 'object' && typeof item.name === 'string') {
                            items.push({
                                name: safeStr(item.name, 'Unknown'),
                                type: safeStr(item.type, 'Unknown'),
                                icon: safeStr(item.icon),
                                stats: Array.isArray(item.stats) ? item.stats : Object.values(item.stats || {}),
                                rarity: item.rarity,
                                affixDetails: item.affixDetails,
                                baseStats: item.baseStats,
                                forgeLevel: item.forgeLevel,
                                limitSlot: item.limitSlot,
                            });
                        }
                    }
                }
                setVaultItems(items);
            } catch (e) {}
        });

        const h2 = GameEvents.Subscribe('update_equipment_ui', (data: any) => {
            if (!active || !mountedRef.current) return;
            try {
                const eq: Record<string, ExternalRewardItem | null> = {};
                if (data?.equipment) {
                    for (const slot in data.equipment) {
                        const item = data.equipment[slot];
                        if (item && typeof item === 'object' && typeof item.name === 'string') {
                            eq[slot] = {
                                name: safeStr(item.name),
                                type: safeStr(item.type),
                                icon: safeStr(item.icon),
                                stats: Array.isArray(item.stats) ? item.stats : Object.values(item.stats || {}),
                                rarity: item.rarity,
                                affixDetails: item.affixDetails,
                                baseStats: item.baseStats,
                                forgeLevel: item.forgeLevel,
                                limitSlot: item.limitSlot,
                            };
                        } else {
                            eq[slot] = null;
                        }
                    }
                }
                setEquippedItems(eq);
            } catch (e) {}
        });

        return () => {
            active = false;
            GameEvents.Unsubscribe(h1);
            GameEvents.Unsubscribe(h2);
        };
    }, [visible]);

    const onEquipItem = (index: number) => {
        if (isEquipping || !mountedRef.current) return;
        setIsEquipping(true);
        setHoverIndex(null);
        
        (GameEvents.SendCustomGameEventToServer as any)('equip_item_from_vault', {
            PlayerID: Players.GetLocalPlayer(),
            index: index
        });

        Game.EmitSound('ui.crafting_gem_create');
        setSelectedItem(null);
        
        if (equipTimeoutRef.current) $.CancelScheduled(equipTimeoutRef.current);
        equipTimeoutRef.current = $.Schedule(1.5, () => {
            if (mountedRef.current) setIsEquipping(false);
            equipTimeoutRef.current = null;
        });
    };

    if (!visible) return null;

    const COLS = 8, TOTAL = 40;
    const empty = Math.max(0, TOTAL - vaultItems.length);

    // 渲染词缀项
    const renderAffixItem = (affix: AffixDetail, idx: number, keyPrefix: string) => {
        const isPrefix = affix.position === 'prefix';
        const barColor = isPrefix ? '#6a5acd' : '#daa520';
        const textColor = isPrefix ?  '#b8b8ff' : '#ffd700';
        
        return (
            <Panel key={`${keyPrefix}-${idx}`} style={{ 
                width: '100%', 
                flowChildren: 'right',
                marginBottom: '8px',
            }}>
                <Panel style={{ 
                    width: '4px', 
                    backgroundColor: barColor,
                    marginRight: '10px',
                    height: '100%',
                    minHeight: '30px',
                }} />
                <Panel style={{ flowChildren: 'down', width: '300px' }}>
                    <Panel style={{ flowChildren: 'right', width: '100%' }}>
                        <Label 
                            text={affix.name} 
                            style={{ 
                                fontSize: '14px', 
                                color: textColor, 
                                fontWeight: 'bold',
                                width: '250px',
                            }} 
                        />
                        <Label 
                            text={`T${affix.tier}`} 
                            style={{ fontSize: '12px', color: barColor, fontWeight: 'bold', marginLeft: '8px' }} 
                        />
                    </Panel>
                    {affix.description && (
                        <Label 
                            text={affix.description} 
                            style={{ 
                                fontSize: '12px', 
                                color: '#aaaaaa', 
                                marginTop: '3px',
                                width: '300px',
                            }} 
                        />
                    )}
                </Panel>
            </Panel>
        );
    };

    const hoverItem = hoverIndex !== null && hoverIndex < vaultItems.length ?  vaultItems[hoverIndex] : null;

    // ⭐ 自适应屏幕分辨率计算悬停面板位置
    const getHoverScreenPosition = (idx: number) => {
        const row = Math.floor(idx / COLS);
        const col = idx % COLS;
        const SLOT_SIZE = 80;
        const SLOT_MARGIN = 2;
        const GRID_PADDING = 15;
        const PANEL_WIDTH = 380;
        const VAULT_W = 740;
        const VAULT_H = 520;
        
        // ⭐ 获取当前屏幕分辨率
        const screenW = Game.GetScreenWidth();
        const screenH = Game.GetScreenHeight();
        
        // 背包居中位置
        const vaultX = (screenW - VAULT_W) / 2;
        const vaultY = (screenH - VAULT_H) / 2;
        
        // 物品在背包内的位置
        const itemLocalX = GRID_PADDING + col * (SLOT_SIZE + SLOT_MARGIN * 2);
        const itemLocalY = 60 + GRID_PADDING + row * (SLOT_SIZE + SLOT_MARGIN * 2);
        
        // 默认显示在右侧
        let panelX = vaultX + itemLocalX + SLOT_SIZE + 20;
        let panelY = vaultY + itemLocalY - 30;
        
        // 右边界检查 - 如果超出屏幕右侧，显示在物品左侧
        if (panelX + PANEL_WIDTH > screenW - 20) {
            panelX = vaultX + itemLocalX - PANEL_WIDTH - 20;
        }
        
        // 左边界检查
        if (panelX < 20) {
            panelX = 20;
        }
        
        // 上边界检查
        if (panelY < 20) {
            panelY = 20;
        }
        
        // 下边界检查 - 预估面板高度约 500px
        if (panelY > screenH - 520) {
            panelY = screenH - 520;
        }
        
        return { x: panelX, y: panelY };
    };

    const selectedItemData = selectedItem !== null && selectedItem < vaultItems.length ? vaultItems[selectedItem] : null;

    return (
        <>
            {/* 背包主体 */}
            <Panel style={{ 
                width: '740px', 
                height: '520px', 
                horizontalAlign: 'center', 
                verticalAlign: 'center', 
                backgroundColor: '#1c1410', 
                border: '4px solid #8b7355', 
                flowChildren: 'down',
            }}>
                {/* Header */}
                <Panel style={{ 
                    width: '100%', 
                    height: '60px', 
                    backgroundColor: '#2a1f1a', 
                    borderBottom: '3px solid #8b7355', 
                    flowChildren: 'right', 
                    padding: '10px 20px' 
                }}>
                    <Label text="Equipment Vault" style={{ fontSize: '32px', color: '#ffd700', fontWeight: 'bold' }} />
                    <Label text={`${vaultItems.length} / ${TOTAL}`} style={{ fontSize: '24px', color: '#cccccc', marginLeft: '20px', marginTop: '4px' }} />
                    <Panel style={{ width: '380px', height: '1px' }} />
                    <Button onactivate={onClose} style={{ width: '40px', height: '40px', backgroundColor: '#8b0000', border: '2px solid #ff0000' }}>
                        <Label text="X" style={{ fontSize: '28px', color: 'white', textAlign: 'center' }} />
                    </Button>
                </Panel>

                {/* Grid */}
                <Panel style={{ width: '100%', height: '460px', padding: '15px', flowChildren: 'right-wrap' }}>
                    {vaultItems.map((item, idx) => {
                        if (!item) return null;
                        const c = getColor(item);
                        const isSelected = selectedItem === idx;
                        const isHovered = hoverIndex === idx;
                        
                        return (
                            <Panel
                                key={`i-${idx}`}
                                hittest={true}
                                style={{
                                    width: '80px', 
                                    height: '80px', 
                                    margin: '2px',
                                    backgroundColor: isSelected ? '#2a2a2a' : (isHovered ? '#1a1a1a' : '#0a0a0a'),
                                    border: isHovered ? `4px solid ${c}` : `3px solid ${c}`,
                                    backgroundImage: `url("${safeStr(item.icon)}")`,
                                    backgroundSize: 'cover', 
                                    backgroundPosition: 'center',
                                }}
                                onactivate={() => { 
                                    Game.EmitSound('ui.button_click');
                                    setHoverIndex(null);
                                    if (selectedItem === idx) {
                                        setSelectedItem(null);
                                    } else {
                                        setSelectedItem(idx);
                                    }
                                }}
                                onmouseover={() => onItemMouseOver(idx)}
                                onmouseout={() => onItemMouseOut()}
                            >
                                {isSelected && <Panel style={{ width: '100%', height: '100%', backgroundColor: '#ffffff40' }} />}
                            </Panel>
                        );
                    })}
                    {Array.from({ length: empty }, (_, i) => (
                        <Panel key={`e-${i}`} style={{ width: '80px', height: '80px', margin: '2px', backgroundColor: '#0a0a0a', border: '2px solid #3a3a3a' }} />
                    ))}
                </Panel>
            </Panel>

            {/* ⭐ 悬停面板 - 使用自适应屏幕坐标 */}
            {hoverItem && hoverIndex !== null && selectedItem === null && (() => {
                const pos = getHoverScreenPosition(hoverIndex);
                const { prefixes, suffixes } = extractAffixes(hoverItem.affixDetails);
                const qualityColor = getColor(hoverItem);
                const compare = findEquipped(hoverItem.type);
                const { prefixes: cp, suffixes: cs } = compare ? extractAffixes(compare.affixDetails) : { prefixes: [], suffixes: [] };
                
                return (
                    <Panel
                        hittest={true}
                        onmouseover={onHoverPanelMouseOver}
                        onmouseout={onHoverPanelMouseOut}
                        style={{
                            width: '380px',
                            flowChildren: 'down',
                            backgroundColor: '#120e18f5',
                            border: `3px solid ${qualityColor}`,
                            boxShadow: '0px 0px 20px 5px #00000088',
                            position: 'absolute',
                            transform: `translatex(${pos.x}px) translatey(${pos.y}px)`,
                        }}
                    >
                        {/* 顶部：图标 + 名称信息 */}
                        <Panel style={{
                            width: '100%',
                            flowChildren: 'right',
                            padding: '14px',
                            backgroundColor: '#0a0812',
                            borderBottom: `2px solid ${qualityColor}66`,
                        }}>
                            <Panel style={{
                                width: '75px',
                                height: '75px',
                                minWidth: '75px',
                                backgroundImage: `url("${safeStr(hoverItem.icon)}")`,
                                backgroundSize: 'cover',
                                border: `2px solid ${qualityColor}`,
                                marginRight: '14px',
                            }} />
                            <Panel style={{ flowChildren: 'down', width: '260px' }}>
                                <Label 
                                    text={safeStr(hoverItem.name, 'Unknown')} 
                                    style={{ 
                                        fontSize: '20px', 
                                        color: qualityColor, 
                                        fontWeight: 'bold',
                                        marginBottom: '5px',
                                        width: '260px',
                                    }} 
                                />
                                <Panel style={{ flowChildren: 'right', marginBottom: '8px' }}>
                                    <Label 
                                        text={QUALITY_NAMES[hoverItem.rarity ??  0] || 'Common'} 
                                        style={{ fontSize: '14px', color: qualityColor, marginRight: '10px' }} 
                                    />
                                    <Label 
                                        text={safeStr(hoverItem.type)} 
                                        style={{ fontSize: '14px', color: '#aaaaaa' }} 
                                    />
                                    {hoverItem.limitSlot && (
                                        <Label 
                                            text={`[${hoverItem.limitSlot}]`} 
                                            style={{ fontSize: '12px', color: '#ff8888', marginLeft: '8px' }} 
                                        />
                                    )}
                                </Panel>
                                {hoverItem.stats && hoverItem.stats.length > 0 && (
                                    <Panel style={{ flowChildren: 'down' }}>
                                        {hoverItem.stats.map((stat, i) => (
                                            <Label 
                                                key={`stat-${i}`}
                                                text={`+${stat.value} ${stat.attribute}`} 
                                                style={{ fontSize: '15px', color: '#55ff55', marginBottom: '2px' }} 
                                            />
                                        ))}
                                    </Panel>
                                )}
                            </Panel>
                        </Panel>

                        {/* 锻造潜能 */}
                        {hoverItem.forgeLevel !== undefined && (
                            <Panel style={{ 
                                width: '100%', 
                                padding: '10px 14px',
                                backgroundColor: '#1a0808',
                                flowChildren: 'right',
                            }}>
                                <Label text="Forge Potential: " style={{ fontSize: '15px', color: '#ff6600' }} />
                                <Label text={`${hoverItem.forgeLevel}`} style={{ fontSize: '15px', color: '#ffaa00', fontWeight: 'bold' }} />
                            </Panel>
                        )}

                        {/* 前缀区域 */}
                        {prefixes.length > 0 && (
                            <Panel style={{ 
                                width: '100%', 
                                padding: '12px 14px',
                                flowChildren: 'down',
                                backgroundColor: '#0e0c16',
                            }}>
                                <Label 
                                    text={`Prefix (${prefixes.length})`}
                                    style={{ fontSize: '16px', color: '#9999ff', fontWeight: 'bold', marginBottom: '10px' }} 
                                />
                                {prefixes.map((affix, i) => renderAffixItem(affix, i, 'pre'))}
                            </Panel>
                        )}

                        {/* 后缀区域 */}
                        {suffixes.length > 0 && (
                            <Panel style={{ 
                                width: '100%', 
                                padding: '12px 14px',
                                flowChildren: 'down',
                                backgroundColor: '#16130a',
                            }}>
                                <Label 
                                    text={`Suffix (${suffixes.length})`}
                                    style={{ fontSize: '16px', color: '#ffdd77', fontWeight: 'bold', marginBottom: '10px' }} 
                                />
                                {suffixes.map((affix, i) => renderAffixItem(affix, i, 'suf'))}
                            </Panel>
                        )}

                        {/* 对比区域 */}
                        {compare && (
                            <Panel style={{ 
                                width: '100%', 
                                padding: '12px 14px',
                                flowChildren: 'down',
                                backgroundColor: '#080808',
                                borderTop: '2px solid #333333',
                            }}>
                                <Label 
                                    text="Currently Equipped"
                                    style={{ fontSize: '12px', color: '#666666', marginBottom: '6px' }} 
                                />
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Panel style={{
                                        width: '36px',
                                        height: '36px',
                                        backgroundImage: `url("${safeStr(compare.icon)}")`,
                                        backgroundSize: 'cover',
                                        border: `1px solid ${getColor(compare)}`,
                                        marginRight: '10px',
                                    }} />
                                    <Panel style={{ flowChildren: 'down' }}>
                                        <Label 
                                            text={safeStr(compare.name)} 
                                            style={{ fontSize: '14px', color: getColor(compare), fontWeight: 'bold' }} 
                                        />
                                        {compare.stats && compare.stats.length > 0 && (
                                            <Panel style={{ flowChildren: 'right' }}>
                                                {compare.stats.slice(0, 2).map((stat, i) => (
                                                    <Label 
                                                        key={`cstat-${i}`}
                                                        text={`+${stat.value} ${stat.attribute}`} 
                                                        style={{ fontSize: '11px', color: '#666666', marginRight: '8px' }} 
                                                    />
                                                ))}
                                            </Panel>
                                        )}
                                    </Panel>
                                </Panel>
                                {(cp.length > 0 || cs.length > 0) && (
                                    <Label 
                                        text={`${cp.length} prefix, ${cs.length} suffix`} 
                                        style={{ fontSize: '11px', color: '#555555' }} 
                                    />
                                )}
                            </Panel>
                        )}

                        {/* 底部提示 */}
                        <Panel style={{ 
                            width: '100%', 
                            padding: '10px 14px',
                            backgroundColor: '#0a0812',
                            borderTop: '1px solid #333333',
                        }}>
                            <Label text="Left-click to select and equip" style={{ fontSize: '12px', color: '#555555', textAlign: 'center' }} />
                        </Panel>
                    </Panel>
                );
            })()}

            {/* 选中详情面板 */}
            {selectedItemData && (() => {
                const { prefixes, suffixes } = extractAffixes(selectedItemData.affixDetails);
                const compare = findEquipped(selectedItemData.type);
                const { prefixes: cp, suffixes: cs } = compare ? extractAffixes(compare.affixDetails) : { prefixes: [], suffixes: [] };
                const qualityColor = getColor(selectedItemData);
                
                return (
                    <Panel 
                        style={{ 
                            width: '100%', 
                            height: '100%',
                            position: 'absolute',
                            transform: 'translatex(0px) translatey(0px)',
                            backgroundColor: '#00000088',
                        }}
                        onactivate={() => setSelectedItem(null)}
                    >
                        <Panel 
                            style={{ 
                                width: '420px', 
                                maxHeight: '90%',
                                backgroundColor: '#120e18f5', 
                                border: `3px solid ${qualityColor}`, 
                                horizontalAlign: 'center',
                                verticalAlign: 'center',
                                flowChildren: 'down',
                                overflow: 'squish scroll',
                                boxShadow: '0px 0px 30px 10px #00000088',
                            }}
                            onactivate={() => {}}
                        >
                            {/* 顶部信息 */}
                            <Panel style={{
                                width: '100%',
                                flowChildren: 'right',
                                padding: '16px',
                                backgroundColor: '#0a0812',
                                borderBottom: `2px solid ${qualityColor}66`,
                            }}>
                                <Panel style={{
                                    width: '85px',
                                    height: '85px',
                                    minWidth: '85px',
                                    backgroundImage: `url("${safeStr(selectedItemData.icon)}")`,
                                    backgroundSize: 'cover',
                                    border: `3px solid ${qualityColor}`,
                                    marginRight: '16px',
                                }} />
                                <Panel style={{ flowChildren: 'down', width: '290px' }}>
                                    <Label 
                                        text={safeStr(selectedItemData.name)} 
                                        style={{ 
                                            fontSize: '24px', 
                                            color: qualityColor, 
                                            fontWeight: 'bold', 
                                            marginBottom: '6px',
                                            width: '290px',
                                        }} 
                                    />
                                    <Panel style={{ flowChildren: 'right', marginBottom: '10px' }}>
                                        <Label text={QUALITY_NAMES[selectedItemData.rarity ?? 0]} style={{ fontSize: '15px', color: qualityColor, marginRight: '12px' }} />
                                        <Label text={safeStr(selectedItemData.type)} style={{ fontSize: '15px', color: '#aaaaaa' }} />
                                    </Panel>
                                    {selectedItemData.stats && selectedItemData.stats.length > 0 && (
                                        <Panel style={{ flowChildren: 'down' }}>
                                            {selectedItemData.stats.map((stat, i) => (
                                                <Label key={`sstat-${i}`} text={`+${stat.value} ${stat.attribute}`} style={{ fontSize: '16px', color: '#55ff55', marginBottom: '3px' }} />
                                            ))}
                                        </Panel>
                                    )}
                                </Panel>
                            </Panel>

                            {/* 锻造潜能 */}
                            {selectedItemData.forgeLevel !== undefined && (
                                <Panel style={{ width: '100%', padding: '12px 16px', backgroundColor: '#1a0808', flowChildren: 'right' }}>
                                    <Label text="Forge Potential: " style={{ fontSize: '16px', color: '#ff6600' }} />
                                    <Label text={`${selectedItemData.forgeLevel}`} style={{ fontSize: '16px', color: '#ffaa00', fontWeight: 'bold' }} />
                                </Panel>
                            )}

                            {/* 前缀 */}
                            {prefixes.length > 0 && (
                                <Panel style={{ width: '100%', padding: '14px 16px', flowChildren: 'down', backgroundColor: '#0e0c16' }}>
                                    <Label text={`Prefix (${prefixes.length})`} style={{ fontSize: '18px', color: '#9999ff', fontWeight: 'bold', marginBottom: '12px' }} />
                                    {prefixes.map((affix, i) => renderAffixItem(affix, i, 'sel-pre'))}
                                </Panel>
                            )}

                            {/* 后缀 */}
                            {suffixes.length > 0 && (
                                <Panel style={{ width: '100%', padding: '14px 16px', flowChildren: 'down', backgroundColor: '#16130a' }}>
                                    <Label text={`Suffix (${suffixes.length})`} style={{ fontSize: '18px', color: '#ffdd77', fontWeight: 'bold', marginBottom: '12px' }} />
                                    {suffixes.map((affix, i) => renderAffixItem(affix, i, 'sel-suf'))}
                                </Panel>
                            )}

                            {/* 对比装备 */}
                            {compare && (
                                <Panel style={{ width: '100%', padding: '14px 16px', flowChildren: 'down', backgroundColor: '#080808', borderTop: '2px solid #333' }}>
                                    <Label text="Currently Equipped" style={{ fontSize: '13px', color: '#666666', marginBottom: '8px' }} />
                                    <Panel style={{ flowChildren: 'right', marginBottom: '8px' }}>
                                        <Panel style={{
                                            width: '45px',
                                            height: '45px',
                                            backgroundImage: `url("${safeStr(compare.icon)}")`,
                                            backgroundSize: 'cover',
                                            border: `2px solid ${getColor(compare)}`,
                                            marginRight: '12px',
                                        }} />
                                        <Panel style={{ flowChildren: 'down' }}>
                                            <Label text={safeStr(compare.name)} style={{ fontSize: '16px', color: getColor(compare), fontWeight: 'bold', marginBottom: '4px' }} />
                                            {compare.stats && compare.stats.length > 0 && (
                                                <Panel style={{ flowChildren: 'right' }}>
                                                    {compare.stats.map((stat, i) => (
                                                        <Label key={`cmpstat-${i}`} text={`+${stat.value} ${stat.attribute}`} style={{ fontSize: '12px', color: '#666666', marginRight: '10px' }} />
                                                    ))}
                                                </Panel>
                                            )}
                                        </Panel>
                                    </Panel>
                                    <Label text={`Affixes: ${cp.length} prefix, ${cs.length} suffix`} style={{ fontSize: '12px', color: '#555555' }} />
                                </Panel>
                            )}

                            {! compare && (
                                <Panel style={{ width: '100%', padding: '16px', backgroundColor: '#080808', borderTop: '2px solid #333' }}>
                                    <Label text="No equipped item of this type" style={{ fontSize: '14px', color: '#555555', textAlign: 'center' }} />
                                </Panel>
                            )}

                            {/* 按钮 */}
                            <Panel style={{ width: '100%', flowChildren: 'right', padding: '16px', backgroundColor: '#0a0812', borderTop: '1px solid #333' }}>
                                <Button 
                                    onactivate={() => onEquipItem(selectedItem! )} 
                                    style={{ width: '180px', height: '50px', backgroundColor: isEquipping ? '#444' : '#1a5a1a', marginRight: '16px', border: '2px solid #2a8a2a' }}
                                >
                                    <Label text={isEquipping ? "Equipping..." : "Equip Item"} style={{ fontSize: '18px', color: 'white', textAlign: 'center', fontWeight: 'bold' }} />
                                </Button>
                                <Button 
                                    onactivate={() => setSelectedItem(null)} 
                                    style={{ width: '180px', height: '50px', backgroundColor: '#3a3a3a', border: '2px solid #4a4a4a' }}
                                >
                                    <Label text="Cancel" style={{ fontSize: '18px', color: 'white', textAlign: 'center', fontWeight: 'bold' }} />
                                </Button>
                            </Panel>
                        </Panel>
                    </Panel>
                );
            })()}
        </>
    );
};