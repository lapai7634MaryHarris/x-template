import React, { useState, useEffect, useRef } from 'react';

// 装备属性接口
interface EquipmentStat {
    attribute: string;
    value: number;
}

// 词缀详情接口
interface AffixDetail {
    position: 'prefix' | 'suffix';
    tier: number;
    name: string;
    description: string;
    color?: string;
}

// 装备物品接口
interface ExternalRewardItem {
    name: string;
    type: string;
    icon: string;
    stats: EquipmentStat[];
    rarity?: number;
    affixDetails?: AffixDetail[];
}

interface VaultUIProps {
    visible: boolean;
    onClose: () => void;
}

export const VaultUI: React.FC<VaultUIProps> = ({ visible, onClose }) => {
    const [vaultItems, setVaultItems] = useState<ExternalRewardItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<number | null>(null);
    const [equippedItems, setEquippedItems] = useState<Record<string, ExternalRewardItem | null>>({});
    const [hoveredItem, setHoveredItem] = useState<number | null>(null);
    const [compareEquipment, setCompareEquipment] = useState<ExternalRewardItem | null>(null);
    const [isEquipping, setIsEquipping] = useState(false);
    
    const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null);
    const [hoveredPosition, setHoveredPosition] = useState<{ row: number; col: number } | null>(null);

    // ⭐ 使用 Panorama 的 Schedule 而不是 setTimeout
    const hoverScheduleHandle = useRef<ScheduleID | null>(null);
    const equipScheduleHandle = useRef<ScheduleID | null>(null);
    
    // ⭐ 清理所有计划任务
    useEffect(() => {
        return () => {
            if (hoverScheduleHandle.current !== null) {
                $.CancelScheduled(hoverScheduleHandle.current);
                hoverScheduleHandle.current = null;
            }
            if (equipScheduleHandle.current !== null) {
                $.CancelScheduled(equipScheduleHandle.current);
                equipScheduleHandle.current = null;
            }
        };
    }, []);
    
 // ==================== 辅助函数：提取前后缀（修复版 - 添加空值检查）====================
const extractAffixes = (affixDetails: any) => {
    const prefixes: any[] = [];
    const suffixes: any[] = [];
    
    // ⭐ 添加空值检查
    if (! affixDetails) {
        return { prefixes, suffixes };
    }
    
    // ⭐ 安全遍历
    try {
        for (const key in affixDetails) {
            const affix = affixDetails[key];
            // ⭐ 确保 affix 存在且有必要的属性
            if (affix && typeof affix === 'object' && affix.position) {
                if (affix.position === 'prefix') {
                    prefixes.push(affix);
                } else if (affix.position === 'suffix') {
                    suffixes.push(affix);
                }
            }
        }
    } catch (e) {
        // 忽略错误，返回空数组
    }
    
    return { prefixes, suffixes };
};
    
    // ==================== 数据加载逻辑 ====================
    useEffect(() => {
        if (!visible) return;

        (GameEvents.SendCustomGameEventToServer as any)('request_vault_data', {
            PlayerID: Players.GetLocalPlayer()
        });

        (GameEvents.SendCustomGameEventToServer as any)('request_equipment_data', {
            PlayerID: Players.GetLocalPlayer(),
        });

        const vaultListener = GameEvents.Subscribe('update_vault_ui', (data: any) => {
            const items: ExternalRewardItem[] = [];
            if (data.items) {
                if (Array.isArray(data.items)) {
                    items.push(...data.items.map((item: any) => ({
                        ...item,
                        stats: Array.isArray(item.stats) ? item.stats : Object.values(item.stats || {})
                    })));
                } else if (typeof data.items === 'object') {
                    for (const key in data.items) {
                        const item = data.items[key];
                        if (item) {
                            const statsArray = Array.isArray(item.stats) 
                                ? item.stats 
                                : Object.values(item.stats || {});
                            items.push({
                                ...item,
                                stats: statsArray
                            });
                        }
                    }
                }
            }
            setVaultItems(items);
        });

        const equipmentListener = GameEvents.Subscribe('update_equipment_ui', (data: any) => {
            const processedEquipment: Record<string, ExternalRewardItem | null> = {};
            
            for (const slot in data.equipment) {
                const item = data.equipment[slot];
                
                if (item) {
                    const statsArray = Array.isArray(item.stats) 
                        ? item.stats 
                        : Object.values(item.stats || {});
                    
                    processedEquipment[slot] = {
                        ...item,
                        stats: statsArray
                    };
                } else {
                    processedEquipment[slot] = null;
                }
            }
            
            setEquippedItems(processedEquipment);
        });

        return () => {
            GameEvents.Unsubscribe(vaultListener);
            GameEvents.Unsubscribe(equipmentListener);
        };
    }, [visible]);

    // ==================== 装备物品逻辑 ====================
    const onEquipItem = (index: number) => {
        if (isEquipping) return;
        
        setIsEquipping(true);
        
        (GameEvents.SendCustomGameEventToServer as any)('equip_item_from_vault', {
            PlayerID: Players.GetLocalPlayer(),
            index: index
        });

        Game.EmitSound('ui.crafting_gem_create');
        
        setSelectedItem(null);
        setSelectedPosition(null);
        setHoveredItem(null);
        setHoveredPosition(null);
        setCompareEquipment(null);
        
        // ⭐ 取消之前的计划
        if (equipScheduleHandle.current !== null) {
            $.CancelScheduled(equipScheduleHandle.current);
        }
        
        // ⭐ 使用 $.Schedule 代替 setTimeout
        equipScheduleHandle.current = $.Schedule(1.5, () => {
            setIsEquipping(false);
            equipScheduleHandle.current = null;
        });
    };

    const findEquippedItemByType = (itemType: string): ExternalRewardItem | null => {
        for (const slot in equippedItems) {
            const equipped = equippedItems[slot];
            if (equipped && equipped.type === itemType) {
                return equipped;
            }
        }
        return null;
    };

    const handleMouseOver = (index: number, item: ExternalRewardItem, row: number, col: number) => {
        // ⭐ 取消之前的隐藏计划
        if (hoverScheduleHandle.current !== null) {
            $.CancelScheduled(hoverScheduleHandle.current);
            hoverScheduleHandle.current = null;
        }
        
        setHoveredItem(index);
        setHoveredPosition({ row, col });
        const equipped = findEquippedItemByType(item.type);
        setCompareEquipment(equipped);
    };

    const handleMouseOut = () => {
        // ⭐ 取消之前的计划
        if (hoverScheduleHandle.current !== null) {
            $.CancelScheduled(hoverScheduleHandle.current);
        }
        
        // ⭐ 使用 $.Schedule 代替 setTimeout
        hoverScheduleHandle.current = $.Schedule(0.3, () => {
            setHoveredItem(null);
            setHoveredPosition(null);
            setCompareEquipment(null);
            hoverScheduleHandle.current = null;
        });
    };

    const keepHoverPanel = () => {
        if (hoverScheduleHandle.current !== null) {
            $.CancelScheduled(hoverScheduleHandle.current);
            hoverScheduleHandle.current = null;
        }
    };

    // ==================== 获取物品品质颜色 ====================
    const getQualityColor = (item: ExternalRewardItem): string => {
        if (item.rarity !== undefined) {
            const rarityColors: Record<number, string> = {
                0: '#c8c8c8',  // 普通 - 灰白色
                1: '#8888ff',  // 魔法 - 蓝色
                2: '#ffff77',  // 稀有 - 黄色
                3: '#ff8800',  // 传说 - 橙色
            };
            return rarityColors[item.rarity] || '#9d9d9d';
        }
        
        const totalValue = item.stats.reduce((sum, stat) => sum + stat.value, 0);
        
        if (totalValue >= 50) return '#ff8000';
        if (totalValue >= 35) return '#a335ee';
        if (totalValue >= 20) return '#0070dd';
        if (totalValue >= 10) return '#1eff00';
        return '#9d9d9d';
    };

    if (!visible) return null;

    const COLUMNS = 8;
    const ROWS = 5;
    const TOTAL_SLOTS = COLUMNS * ROWS;
    const emptySlots = TOTAL_SLOTS - vaultItems.length;
    
    const SLOT_SIZE = 80;
    const SLOT_MARGIN = 2;
    const GRID_PADDING = 15;

    const getPopupPosition = (position: { row: number; col: number } | null, popupWidth: number) => {
        if (!position) return { marginLeft: '0px', marginTop: '0px' };
        
        const { row, col } = position;
        
        const slotX = GRID_PADDING + col * (SLOT_SIZE + SLOT_MARGIN * 2);
        const slotY = 60 + GRID_PADDING + row * (SLOT_SIZE + SLOT_MARGIN * 2);
        
        let popupX = slotX + SLOT_SIZE + 10;
        let popupY = slotY - 30;
        
        if (popupX + popupWidth > 740) {
            popupX = slotX - popupWidth - 10;
        }
        
        if (popupY < 10) {
            popupY = 10;
        }
        
        return {
            marginLeft: `${popupX}px`,
            marginTop: `${popupY}px`,
        };
    };

    const hoveredItemData = hoveredItem !== null && hoveredItem < vaultItems.length 
        ? vaultItems[hoveredItem] 
        : null;

    return (
        <Panel
            style={{
                width: '740px',
                height: '520px',
                horizontalAlign: 'center',
                verticalAlign: 'center',
                backgroundColor: '#1c1410',
                border: '4px solid #8b7355',
                flowChildren: 'down',
            }}
        >
            {/* 标题栏 */}
            <Panel style={{
                width: '100%',
                height: '60px',
                backgroundColor: '#2a1f1a',
                borderBottom: '3px solid #8b7355',
                flowChildren: 'right',
                padding: '10px 20px',
            }}>
                <Label 
                    text="⚔️ 装备仓库" 
                    style={{
                        fontSize: '32px',
                        color: '#ffd700',
                        fontWeight: 'bold',
                    }}
                />
                <Label 
                    text={`${vaultItems.length} / ${TOTAL_SLOTS}`}
                    style={{
                        fontSize: '24px',
                        color: '#cccccc',
                        marginLeft: '20px',
                        marginTop: '4px',
                    }}
                />
                <Panel style={{ width: 'fill-parent-flow(1)', height: '1px' }} />
                <Button 
                    onactivate={onClose}
                    style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#8b0000',
                        border: '2px solid #ff0000',
                    }}
                    onmouseover={(panel) => {
                        panel.style.backgroundColor = '#b22222';
                    }}
                    onmouseout={(panel) => {
                        panel.style.backgroundColor = '#8b0000';
                    }}
                >
                    <Label text="✕" style={{ fontSize: '28px', color: 'white', textAlign: 'center' }} />
                </Button>
            </Panel>

            {/* 网格容器 */}
            <Panel style={{
                width: '100%',
                height: '460px',
                padding: '15px',
                flowChildren: 'right-wrap',
            }}>
                {vaultItems.map((item, index) => {
                    const qualityColor = getQualityColor(item);
                    const normalBorder = `3px solid ${qualityColor}`;
                    const hoverBorder = `4px solid ${qualityColor}`;
                    const isHovered = hoveredItem === index;
                    
                    const row = Math.floor(index / COLUMNS);
                    const col = index % COLUMNS;
                    
                    return (
                        <Panel 
                            key={`item-${index}`}
                            style={{
                                width: '80px',
                                height: '80px',
                                margin: '2px',
                                backgroundColor: isHovered ? '#1a1a1a' : '#0a0a0a',
                                border: isHovered ?  hoverBorder : normalBorder,
                                backgroundImage: `url("${item.icon}")`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                            onactivate={() => {
                                Game.EmitSound('ui.button_click');
                                setSelectedItem(index);
                                setSelectedPosition({ row, col });
                            }}
                            onmouseover={() => {
                                handleMouseOver(index, item, row, col);
                                Game.EmitSound('ui.button_over');
                            }}
                            onmouseout={() => {
                                handleMouseOut();
                            }}
                        >
                            {selectedItem === index && (
                                <Panel style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: '#ffffff40',
                                }} />
                            )}
                        </Panel>
                    );
                })}

                {Array.from({ length: emptySlots }, (_, index) => (
                    <Panel 
                        key={`empty-${index}`}
                        style={{
                            width: '80px',
                            height: '80px',
                            margin: '2px',
                            backgroundColor: '#0a0a0a',
                            border: '2px solid #3a3a3a',
                        }}
                    />
                ))}
            </Panel>

            {/* ⭐ 装备悬停对比面板 */}
            {hoveredItem !== null && hoveredItemData && hoveredPosition && selectedItem === null && (() => {
                const hoverPos = getPopupPosition(hoveredPosition, 350);
                const { prefixes, suffixes } = extractAffixes(hoveredItemData.affixDetails);
                
                return (
                    <Panel hittest={false}
                        style={{
                            width: '740px',
                            height: '520px',
                            marginTop: '-520px',
                        }}
                    >
                        <Panel hittest={false}
                            style={{
                                width: '350px',
                                maxHeight: '480px',
                                backgroundColor: '#1a1a1aee',
                                border: '3px solid #ffd700',
                                padding: '15px',
                                marginLeft: hoverPos.marginLeft,
                                marginTop: hoverPos.marginTop,
                                flowChildren: 'down',
                                overflow: 'squish scroll',
                            }}
                            onmouseover={keepHoverPanel}
                            onmouseout={handleMouseOut}
                        >
                            <Label 
                                text="📊 装备对比"
                                style={{
                                    fontSize: '20px',
                                    color: '#ffd700',
                                    textAlign: 'center',
                                    marginBottom: '10px',
                                    fontWeight: 'bold',
                                }}
                            />

                            {/* 待装备物品 */}
                            <Panel style={{
                                width: '100%',
                                backgroundColor: '#0a0a0a',
                                border: `2px solid ${getQualityColor(hoveredItemData)}`,
                                padding: '10px',
                                marginBottom: '10px',
                                flowChildren: 'down',
                            }}>
                                <Label 
                                    text="【待装备】"
                                    style={{ fontSize: '12px', color: '#00ff00', marginBottom: '5px' }}
                                />
                                <Panel style={{ width: '100%', flowChildren: 'right', marginBottom: '5px' }}>
                                    <Panel style={{
                                        width: '50px',
                                        height: '50px',
                                        backgroundImage: `url("${hoveredItemData.icon}")`,
                                        backgroundSize: 'cover',
                                        marginRight: '10px',
                                    }} />
                                    <Panel style={{ flowChildren: 'down' }}>
                                        <Label 
                                            text={hoveredItemData.name}
                                            style={{
                                                fontSize: '16px',
                                                color: getQualityColor(hoveredItemData),
                                                fontWeight: 'bold',
                                                marginBottom: '3px',
                                            }}
                                        />
                                        <Label 
                                            text={hoveredItemData.type}
                                            style={{ fontSize: '12px', color: '#ffd700', marginBottom: '8px' }}
                                        />
                                        
                                        {/* 前缀显示 */}
                                        {prefixes.length > 0 && (
                                            <>
                                                <Label 
                                                    text={`━━ 前缀 (${prefixes.length}) ━━`}
                                                    style={{ fontSize: '11px', color: '#8888ff', marginBottom: '3px', fontWeight: 'bold' }}
                                                />
                                                {prefixes.map((affix: any, idx: number) => (
                                                    <Label 
                                                        key={`prefix-${idx}`}
                                                        text={`[T${affix.tier}] ${affix.name} ${affix.description}`}
                                                        style={{ 
                                                            fontSize: '11px', 
                                                            color: '#8888ff',
                                                            marginBottom: '2px',
                                                        }}
                                                    />
                                                ))}
                                            </>
                                        )}
                                        
                                        {/* 后缀显示 */}
                                        {suffixes.length > 0 && (
                                            <>
                                                <Label 
                                                    text={`━━ 后缀 (${suffixes.length}) ━━`}
                                                    style={{ fontSize: '11px', color: '#ffff77', marginTop: '5px', marginBottom: '3px', fontWeight: 'bold' }}
                                                />
                                                {suffixes.map((affix: any, idx: number) => (
                                                    <Label 
                                                        key={`suffix-${idx}`}
                                                        text={`[T${affix.tier}] ${affix.name} ${affix.description}`}
                                                        style={{ 
                                                            fontSize: '11px', 
                                                            color: '#ffff77',
                                                            marginBottom: '2px',
                                                        }}
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </Panel>
                                </Panel>
                            </Panel>

                            {/* 分隔线 */}
                            <Panel style={{
                                width: '100%',
                                height: '2px',
                                backgroundColor: '#555555',
                                marginBottom: '10px',
                            }} />

                            {/* 当前已装备 */}
                            {compareEquipment ?  (() => {
                                const { prefixes: currPrefixes, suffixes: currSuffixes } = extractAffixes(compareEquipment.affixDetails);
                                
                                return (
                                    <Panel style={{
                                        width: '100%',
                                        backgroundColor: '#0a0a0a',
                                        border: `2px solid ${getQualityColor(compareEquipment)}`,
                                        padding: '10px',
                                        flowChildren: 'down',
                                    }}>
                                        <Label 
                                            text="【当前装备】"
                                            style={{ fontSize: '12px', color: '#888888', marginBottom: '5px' }}
                                        />
                                        <Panel style={{ width: '100%', flowChildren: 'right', marginBottom: '5px' }}>
                                            <Panel style={{
                                                width: '50px',
                                                height: '50px',
                                                backgroundImage: `url("${compareEquipment.icon}")`,
                                                backgroundSize: 'cover',
                                                marginRight: '10px',
                                            }} />
                                            <Panel style={{ flowChildren: 'down' }}>
                                                <Label 
                                                    text={compareEquipment.name}
                                                    style={{
                                                        fontSize: '16px',
                                                        color: getQualityColor(compareEquipment),
                                                        fontWeight: 'bold',
                                                        marginBottom: '3px',
                                                    }}
                                                />
                                                <Label 
                                                    text={compareEquipment.type}
                                                    style={{ fontSize: '12px', color: '#ffd700', marginBottom: '8px' }}
                                                />
                                                
                                                {/* 当前装备前缀 */}
                                                {currPrefixes.length > 0 && (
                                                    <>
                                                        <Label 
                                                            text={`━━ 前缀 (${currPrefixes.length}) ━━`}
                                                            style={{ fontSize: '11px', color: '#8888ff', marginBottom: '3px', fontWeight: 'bold' }}
                                                        />
                                                        {currPrefixes.map((affix: any, idx: number) => (
                                                            <Label 
                                                                key={`curr-prefix-${idx}`}
                                                                text={`[T${affix.tier}] ${affix.name} ${affix.description}`}
                                                                style={{ 
                                                                    fontSize: '11px', 
                                                                    color: '#8888ff',
                                                                    marginBottom: '2px',
                                                                }}
                                                            />
                                                        ))}
                                                    </>
                                                )}
                                                
                                                {/* 当前装备后缀 */}
                                                {currSuffixes.length > 0 && (
                                                    <>
                                                        <Label 
                                                            text={`━━ 后缀 (${currSuffixes.length}) ━━`}
                                                            style={{ fontSize: '11px', color: '#ffff77', marginTop: '5px', marginBottom: '3px', fontWeight: 'bold' }}
                                                        />
                                                        {currSuffixes.map((affix: any, idx: number) => (
                                                            <Label 
                                                                key={`curr-suffix-${idx}`}
                                                                text={`[T${affix.tier}] ${affix.name} ${affix.description}`}
                                                                style={{ 
                                                                    fontSize: '11px', 
                                                                    color: '#ffff77',
                                                                    marginBottom: '2px',
                                                                }}
                                                            />
                                                        ))}
                                                    </>
                                                )}
                                            </Panel>
                                        </Panel>
                                    </Panel>
                                );
                            })() : (
                                <Panel style={{
                                    width: '100%',
                                    backgroundColor: '#2a2a2a',
                                    padding: '15px',
                                    flowChildren: 'down',
                                }}>
                                    <Label 
                                        text="✨ 当前未装备同类型装备"
                                        style={{
                                            fontSize: '14px',
                                            color: '#888888',
                                            textAlign: 'center',
                                        }}
                                    />
                                </Panel>
                            )}
                        </Panel>
                    </Panel>
                );
            })()}

            {/* ⭐ 装备确认面板 */}
            {selectedItem !== null && selectedItem < vaultItems.length && vaultItems[selectedItem] && selectedPosition && (() => {
                const item = vaultItems[selectedItem];
                const qualityColor = getQualityColor(item);
                const popupPos = getPopupPosition(selectedPosition, 320);
                const { prefixes, suffixes } = extractAffixes(item.affixDetails);
                
                return (
                    <Panel 
                        style={{
                            width: '740px',
                            height: '520px',
                            backgroundColor: '#00000055',
                            marginTop: '-520px',
                        }}
                        onactivate={() => setSelectedItem(null)}
                    >
                        <Panel 
                            style={{
                                width: '320px',
                                backgroundColor: '#1a1a1acc',
                                border: '3px solid #ffd700',
                                padding: '15px',
                                marginLeft: popupPos.marginLeft,
                                marginTop: popupPos.marginTop,
                                flowChildren: 'down',
                            }}
                            onactivate={() => {}}
                        >
                            <Label 
                                text="装备这件物品？"
                                style={{
                                    fontSize: '20px',
                                    color: '#ffd700',
                                    textAlign: 'center',
                                    marginBottom: '10px',
                                    fontWeight: 'bold',
                                }}
                            />
                            
                            {/* 装备信息 */}
                            <Panel style={{
                                width: '100%',
                                backgroundColor: '#0a0a0a',
                                border: `2px solid ${qualityColor}`,
                                padding: '10px',
                                marginBottom: '10px',
                                flowChildren: 'right',
                            }}>
                                <Image 
                                    src={item.icon}
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        marginRight: '10px',
                                    }}
                                />
                                <Panel style={{ flowChildren: 'down' }}>
                                    <Label 
                                        text={item.name}
                                        style={{
                                            fontSize: '16px',
                                            color: qualityColor,
                                            fontWeight: 'bold',
                                            marginBottom: '3px',
                                        }}
                                    />
                                    <Label 
                                        text={item.type}
                                        style={{
                                            fontSize: '12px',
                                            color: '#ffd700',
                                            marginBottom: '8px',
                                        }}
                                    />
                                    
                                    {/* 确认面板前缀 */}
                                    {prefixes.length > 0 && (
                                        <>
                                            <Label 
                                                text={`━━ 前缀 (${prefixes.length}) ━━`}
                                                style={{ fontSize: '11px', color: '#8888ff', marginBottom: '3px', fontWeight: 'bold' }}
                                            />
                                            {prefixes.map((affix: any, idx: number) => (
                                                <Label 
                                                    key={`confirm-prefix-${idx}`}
                                                    text={`[T${affix.tier}] ${affix.name} ${affix.description}`}
                                                    style={{ 
                                                        fontSize: '11px', 
                                                        color: '#8888ff',
                                                        marginBottom: '2px',
                                                    }}
                                                />
                                            ))}
                                        </>
                                    )}
                                    
                                    {/* 确认面板后缀 */}
                                    {suffixes.length > 0 && (
                                        <>
                                            <Label 
                                                text={`━━ 后缀 (${suffixes.length}) ━━`}
                                                style={{ fontSize: '11px', color: '#ffff77', marginTop: '5px', marginBottom: '3px', fontWeight: 'bold' }}
                                            />
                                            {suffixes.map((affix: any, idx: number) => (
                                                <Label 
                                                    key={`confirm-suffix-${idx}`}
                                                    text={`[T${affix.tier}] ${affix.name} ${affix.description}`}
                                                    style={{ 
                                                        fontSize: '11px', 
                                                        color: '#ffff77',
                                                        marginBottom: '2px',
                                                    }}
                                                />
                                            ))}
                                        </>
                                    )}
                                </Panel>
                            </Panel>
                            
                            {/* 按钮区域 */}
                            <Panel style={{
                                width: '100%',
                                flowChildren: 'right',
                            }}>
                                <Button 
                                    onactivate={() => onEquipItem(selectedItem)}
                                    style={{
                                        width: '140px',
                                        height: '40px',
                                        backgroundColor: isEquipping ? '#888888' : '#4caf50',
                                        marginRight: '10px',
                                    }}
                                    onmouseover={(panel) => {
                                        if (! isEquipping) {
                                            panel.style.backgroundColor = '#66bb6a';
                                        }
                                    }}
                                    onmouseout={(panel) => {
                                        if (!isEquipping) {
                                            panel.style.backgroundColor = '#4caf50';
                                        }
                                    }}
                                >
                                    <Label 
                                        text={isEquipping ? "装备中..." : "✔ 确认"}
                                        style={{ fontSize: '16px', color: 'white', textAlign: 'center', fontWeight: 'bold' }} 
                                    />
                                </Button>
                                
                                <Button 
                                    onactivate={() => setSelectedItem(null)}
                                    style={{
                                        width: '140px',
                                        height: '40px',
                                        backgroundColor: '#888888',
                                    }}
                                    onmouseover={(panel) => {
                                        panel.style.backgroundColor = '#aaaaaa';
                                    }}
                                    onmouseout={(panel) => {
                                        panel.style.backgroundColor = '#888888';
                                    }}
                                >
                                    <Label text="✕ 取消" style={{ fontSize: '16px', color: 'white', textAlign: 'center', fontWeight: 'bold' }} />
                                </Button>
                            </Panel>
                        </Panel>
                    </Panel>
                );
            })()}
        </Panel>
    );
};