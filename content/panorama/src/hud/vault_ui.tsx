import React, { useState, useEffect, useRef, FC } from 'react';

interface EquipmentStat {
    attribute: string;
    value: number;
}

interface AffixDetail {
    position: 'prefix' | 'suffix';
    tier: number;
    name: string;
    description: string;
}

interface ExternalRewardItem {
    name: string;
    type: string;
    icon: string;
    stats: EquipmentStat[];
    rarity?: number;
    affixDetails?: AffixDetail[];
    forgeLevel?: number;
}

interface VaultUIProps {
    visible: boolean;
    onClose: () => void;
}

const safeStr = (v: any, d: string = ''): string => {
    if (v === undefined || v === null) return d;
    return String(v);
};

const safeNum = (v: any, d: number = 0): number => {
    if (v === undefined || v === null) return d;
    const n = Number(v);
    return isNaN(n) ?  d : n;
};

const QUALITY_COLORS: Record<number, string> = {
    0: '#c8c8c8',
    1: '#8888ff',
    2: '#ffff77',
    3: '#ff8800',
};

const QUALITY_NAMES: Record<number, string> = {
    0: '普通',
    1: '魔法',
    2: '稀有',
    3: '传说',
};

export const VaultUI: FC<VaultUIProps> = ({ visible, onClose }) => {
    const [vaultItems, setVaultItems] = useState<ExternalRewardItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<number | null>(null);
    const [hoveredItem, setHoveredItem] = useState<number | null>(null);
    const [equippedItems, setEquippedItems] = useState<Record<string, ExternalRewardItem | null>>({});
    const [isEquipping, setIsEquipping] = useState(false);
    
    const equipTimeoutRef = useRef<ScheduleID | null>(null);
    const hoverTimeoutRef = useRef<ScheduleID | null>(null);
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
                        position: a.position === 'suffix' ? 'suffix' : 'prefix',
                        tier: safeNum(a.tier, 1),
                        name: safeStr(a.name, '未知'),
                        description: safeStr(a.description, ''),
                    };
                    if (safe.position === 'prefix') prefixes.push(safe);
                    else suffixes.push(safe);
                }
            }
        } catch (e) {
            $.Msg('[VaultUI] extractAffixes error');
        }
        return { prefixes, suffixes };
    };

    const getColor = (item: ExternalRewardItem | null): string => {
        if (!item) return '#9d9d9d';
        const rarity = safeNum(item.rarity, 0);
        return QUALITY_COLORS[rarity] || '#9d9d9d';
    };

    const getQualityName = (rarity: any): string => {
        const r = safeNum(rarity, 0);
        return QUALITY_NAMES[r] || '普通';
    };

    const findEquipped = (type: string): ExternalRewardItem | null => {
        if (!type) return null;
        for (const slot in equippedItems) {
            const eq = equippedItems[slot];
            if (eq && eq.type === type) return eq;
        }
        return null;
    };

    const onMouseOver = (idx: number) => {
        if (hoverTimeoutRef.current) {
            $.CancelScheduled(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        if (selectedItem === null && mountedRef.current) {
            setHoveredItem(idx);
        }
    };

    const onMouseOut = () => {
        if (hoverTimeoutRef.current) {
            $.CancelScheduled(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = $.Schedule(0.1, () => {
            if (mountedRef.current) {
                setHoveredItem(null);
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
                if (data && data.items) {
                    const arr = Array.isArray(data.items) ? data.items : Object.values(data.items);
                    for (let i = 0; i < arr.length; i++) {
                        const item = arr[i];
                        if (item && typeof item === 'object') {
                            const statsArr: EquipmentStat[] = [];
                            if (item.stats) {
                                const rawStats = Array.isArray(item.stats) ? item.stats : Object.values(item.stats);
                                for (let j = 0; j < rawStats.length; j++) {
                                    const s = rawStats[j];
                                    if (s && s.attribute !== undefined) {
                                        statsArr.push({
                                            attribute: safeStr(s.attribute, ''),
                                            value: safeNum(s.value, 0),
                                        });
                                    }
                                }
                            }
                            items.push({
                                name: safeStr(item.name, '未知物品'),
                                type: safeStr(item.type, '未知'),
                                icon: safeStr(item.icon, ''),
                                stats: statsArr,
                                rarity: safeNum(item.rarity, 0),
                                affixDetails: item.affixDetails || null,
                                forgeLevel: item.forgeLevel,
                            });
                        }
                    }
                }
                setVaultItems(items);
            } catch (e) {
                $.Msg('[VaultUI] update_vault_ui error');
            }
        });

        const h2 = GameEvents.Subscribe('update_equipment_ui', (data: any) => {
            if (!active || !mountedRef.current) return;
            try {
                const eq: Record<string, ExternalRewardItem | null> = {};
                if (data && data.equipment) {
                    for (const slot in data.equipment) {
                        const item = data.equipment[slot];
                        if (item && typeof item === 'object' && item.name) {
                            const statsArr: EquipmentStat[] = [];
                            if (item.stats) {
                                const rawStats = Array.isArray(item.stats) ? item.stats : Object.values(item.stats);
                                for (let j = 0; j < rawStats.length; j++) {
                                    const s = rawStats[j];
                                    if (s && s.attribute !== undefined) {
                                        statsArr.push({
                                            attribute: safeStr(s.attribute, ''),
                                            value: safeNum(s.value, 0),
                                        });
                                    }
                                }
                            }
                            eq[slot] = {
                                name: safeStr(item.name, '未知'),
                                type: safeStr(item.type, '未知'),
                                icon: safeStr(item.icon, ''),
                                stats: statsArr,
                                rarity: safeNum(item.rarity, 0),
                                affixDetails: item.affixDetails || null,
                                forgeLevel: item.forgeLevel,
                            };
                        } else {
                            eq[slot] = null;
                        }
                    }
                }
                setEquippedItems(eq);
            } catch (e) {
                $.Msg('[VaultUI] update_equipment_ui error');
            }
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
        setHoveredItem(null);
        
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

    const TOTAL = 40;
    const empty = Math.max(0, TOTAL - vaultItems.length);
    
    // 当前显示的物品
    const displayIndex = selectedItem !== null ? selectedItem : hoveredItem;
    const displayItem = displayIndex !== null && displayIndex >= 0 && displayIndex < vaultItems.length 
        ? vaultItems[displayIndex] 
        : null;
    const isHoverMode = selectedItem === null && hoveredItem !== null;

    // 渲染物品详情
    const renderItemDetail = (item: ExternalRewardItem) => {
        if (!item) return null;
        
        const { prefixes, suffixes } = extractAffixes(item.affixDetails);
        const qualityColor = getColor(item);
        const compare = findEquipped(safeStr(item.type, ''));
        
        return (
            <Panel className="vault_detail" style={{ border: `2px solid ${qualityColor}` }}>
                {/* 标签 */}
                <Label 
                    text={isHoverMode ? "预览" : "已选择"} 
                    style={{ 
                        fontSize: '14px', 
                        color: isHoverMode ? '#888888' : '#ffd700', 
                        marginBottom: '8px' 
                    }} 
                />
                
                {/* 物品信息 */}
                <Panel style={{ flowChildren: 'right', marginBottom: '10px' }}>
                    <Panel 
                        style={{
                            width: '50px', 
                            height: '50px',
                            backgroundImage: `url("${safeStr(item.icon, '')}")`,
                            backgroundSize: 'cover',
                            border: `2px solid ${qualityColor}`,
                            marginRight: '10px',
                        }} 
                    />
                    <Panel style={{ flowChildren: 'down' }}>
                        <Label text={safeStr(item.name, '未知')} style={{ fontSize: '18px', color: qualityColor, fontWeight: 'bold' }} />
                        <Panel style={{ flowChildren: 'right' }}>
                            <Label text={getQualityName(item.rarity)} style={{ fontSize: '12px', color: qualityColor, marginRight: '8px' }} />
                            <Label text={safeStr(item.type, '')} style={{ fontSize: '12px', color: '#aaaaaa' }} />
                        </Panel>
                    </Panel>
                </Panel>

                {/* 属性 */}
                {item.stats && item.stats.length > 0 && (
                    <Panel style={{ flowChildren: 'down', marginBottom: '8px' }}>
                        {item.stats.map((stat, i) => (
                            <Label 
                                key={`stat-${i}`} 
                                text={`+${safeNum(stat.value, 0)} ${safeStr(stat.attribute, '')}`} 
                                style={{ fontSize: '13px', color: '#55ff55' }} 
                            />
                        ))}
                    </Panel>
                )}

                {/* 词缀 */}
                {prefixes.length > 0 && (
                    <Panel style={{ flowChildren: 'down', marginBottom: '5px' }}>
                        <Label text={`前缀 (${prefixes.length})`} style={{ fontSize: '13px', color: '#9999ff', fontWeight: 'bold' }} />
                        {prefixes.map((a, i) => (
                            <Label 
                                key={`p-${i}`} 
                                text={`  [T${safeNum(a.tier, 1)}] ${safeStr(a.name, '')}`} 
                                style={{ fontSize: '12px', color: '#8888ff' }} 
                            />
                        ))}
                    </Panel>
                )}
                {suffixes.length > 0 && (
                    <Panel style={{ flowChildren: 'down', marginBottom: '5px' }}>
                        <Label text={`后缀 (${suffixes.length})`} style={{ fontSize: '13px', color: '#ffdd77', fontWeight: 'bold' }} />
                        {suffixes.map((a, i) => (
                            <Label 
                                key={`s-${i}`} 
                                text={`  [T${safeNum(a.tier, 1)}] ${safeStr(a.name, '')}`} 
                                style={{ fontSize: '12px', color: '#ddaa00' }} 
                            />
                        ))}
                    </Panel>
                )}

                {/* 对比已装备 */}
                {compare && (
                    <Panel style={{ 
                        width: '100%', 
                        padding: '8px', 
                        backgroundColor: '#00000066', 
                        marginTop: '8px',
                        flowChildren: 'down',
                    }}>
                        <Label text="已装备同类型" style={{ fontSize: '12px', color: '#888888', marginBottom: '5px' }} />
                        <Panel style={{ flowChildren: 'right' }}>
                            <Panel style={{
                                width: '30px', 
                                height: '30px',
                                backgroundImage: `url("${safeStr(compare.icon, '')}")`,
                                backgroundSize: 'cover',
                                marginRight: '8px',
                            }} />
                            <Label text={safeStr(compare.name, '未知')} style={{ fontSize: '14px', color: getColor(compare) }} />
                        </Panel>
                    </Panel>
                )}

                {/* 装备按钮（仅选中模式） */}
                {!isHoverMode && displayIndex !== null && (
                    <Panel style={{ flowChildren: 'right', marginTop: '10px' }}>
                        <Button 
                            className="vault_btn_equip"
                            onactivate={() => onEquipItem(displayIndex)}
                            style={{ backgroundColor: isEquipping ?  '#444444' : '#1a5a1a' }}
                        >
                            <Label text={isEquipping ? "装备中..." : "装备"} />
                        </Button>
                        <Button className="vault_btn_cancel" onactivate={() => setSelectedItem(null)}>
                            <Label text="取消" />
                        </Button>
                    </Panel>
                )}
            </Panel>
        );
    };

    return (
        <Panel className="vault_window">
            {/* 标题栏 */}
            <Panel className="vault_title_bar">
                <Label className="vault_title" text="装备仓库" />
                <Label className="vault_count" text={`${vaultItems.length} / ${TOTAL}`} />
                <Panel className="vault_spacer" />
                <Button className="vault_close_btn" onactivate={onClose}>
                    <Label text="X" />
                </Button>
            </Panel>

            {/* 主内容区 */}
            <Panel className="vault_main">
                {/* 左侧：物品网格 */}
                <Panel className="vault_grid">
                    {vaultItems.map((item, idx) => {
                        if (!item) return null;
                        const c = getColor(item);
                        const isSelected = selectedItem === idx;
                        const isHovered = hoveredItem === idx;
                        
                        return (
                            <Panel
                                key={`item-${idx}`}
                                className="vault_slot"
                                hittest={true}
                                style={{
                                    border: (isSelected || isHovered) ? `4px solid ${c}` : `3px solid ${c}`,
                                    backgroundImage: `url("${safeStr(item.icon, '')}")`,
                                    backgroundColor: isSelected ?  '#2a2a2a' : (isHovered ? '#1a1a1a' : '#0a0a0a'),
                                }}
                                onactivate={() => { 
                                    Game.EmitSound('ui.button_click');
                                    setHoveredItem(null);
                                    setSelectedItem(selectedItem === idx ? null : idx);
                                }}
                                onmouseover={() => onMouseOver(idx)}
                                onmouseout={onMouseOut}
                            >
                                {isSelected && <Panel style={{ width: '100%', height: '100%', backgroundColor: '#ffffff30' }} />}
                            </Panel>
                        );
                    })}
                    {Array.from({ length: empty }, (_, i) => (
                        <Panel key={`empty-${i}`} className="vault_slot_empty" />
                    ))}
                </Panel>

                {/* 右侧：物品详情 */}
                <Panel className="vault_info_panel">
                    {displayItem ?  renderItemDetail(displayItem) : (
                        <Panel className="vault_empty_info">
                            <Label text="悬停查看详情" style={{ fontSize: '14px', color: '#666666', textAlign: 'center' }} />
                            <Label text="点击选择装备" style={{ fontSize: '12px', color: '#555555', textAlign: 'center', marginTop: '5px' }} />
                        </Panel>
                    )}
                </Panel>
            </Panel>
        </Panel>
    );
};