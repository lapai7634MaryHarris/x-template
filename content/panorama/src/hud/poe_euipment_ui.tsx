import React, { useState, useEffect } from 'react';

// ========== 类型定义 ==========
interface AffixData {
    id: string;
    name: string;
    description: string;
    tier: number;
    value: number;
    isPercent: boolean;
}

interface ItemData {
    id: string;
    baseTypeId: string;
    baseName: string;
    baseIcon: string;
    slot: string;
    name: string;
    rarity: number;
    rarityName: string;
    rarityColor: string;
    itemLevel: number;
    prefixes: AffixData[];
    suffixes: AffixData[];
    identified: boolean;
    corrupted: boolean;
}

interface CurrencyData {
    exalted: number;
    chaos: number;
    divine: number;
}

// ========== 颜色常量 ==========
const TIER_COLORS: Record<number, string> = {
    1: '#ff8800',  // T1 橙色
    2: '#a335ee',  // T2 紫色
    3: '#0070dd',  // T3 蓝色
    4: '#1eff00',  // T4 绿色
    5: '#9d9d9d',  // T5 灰色
};

const RARITY_BG_COLORS: Record<number, string> = {
    1: '#1a1a1a',  // 普通 - 深灰
    2: '#0a1a2a',  // 魔法 - 深蓝
    3: '#2a2a0a',  // 稀有 - 深黄
    4: '#2a1a0a',  // 传说 - 深橙
};

// ========== 主组件 ==========
export const POEEquipmentUI: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
    const [equipped, setEquipped] = useState<Record<string, ItemData | null>>({});
    const [inventory, setInventory] = useState<ItemData[]>([]);
    const [currency, setCurrency] = useState<CurrencyData>({ exalted: 0, chaos: 0, divine: 0 });
    const [selectedItem, setSelectedItem] = useState<ItemData | null>(null);
    const [hoveredItem, setHoveredItem] = useState<ItemData | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    // 请求数据
    useEffect(() => {
        if (! visible) return;

        $.Msg('[POEEquipmentUI] 请求装备数据');
        (GameEvents.SendCustomGameEventToServer as any)('equipment_request_data', {
            PlayerID: Players.GetLocalPlayer()
        });

        const listener = GameEvents.Subscribe('equipment_data_update', (data: any) => {
            $.Msg('[POEEquipmentUI] 收到装备数据');
            
            if (data.equipped) {
                const processedEquipped: Record<string, ItemData | null> = {};
                for (const slot in data.equipped) {
                    processedEquipped[slot] = data.equipped[slot] || null;
                }
                setEquipped(processedEquipped);
            }

            if (data.inventory) {
                const items: ItemData[] = [];
                if (Array.isArray(data.inventory)) {
                    items.push(...data.inventory);
                } else {
                    for (const key in data.inventory) {
                        items.push(data.inventory[key]);
                    }
                }
                setInventory(items);
            }

            if (data.currency) {
                setCurrency({
                    exalted: data.currency.exalted || 0,
                    chaos: data.currency.chaos || 0,
                    divine: data.currency.divine || 0,
                });
            }
        });

        const errorListener = GameEvents.Subscribe('equipment_error', (data: any) => {
            $.Msg('[POEEquipmentUI] 错误: ' + data.message);
            Game.EmitSound('General.Cancel');
        });

        return () => {
            GameEvents.Unsubscribe(listener);
            GameEvents.Unsubscribe(errorListener);
        };
    }, [visible]);

    if (!visible) return null;

    // 装备物品
    const equipItem = (item: ItemData) => {
        (GameEvents.SendCustomGameEventToServer as any)('equipment_equip_item', {
            PlayerID: Players.GetLocalPlayer(),
            itemId: item.id,
            slot: item.slot,
        });
        Game.EmitSound('Item.PickUpGemShop');
        setSelectedItem(null);
    };

    // 卸下装备
    const unequipItem = (slot: string) => {
        (GameEvents.SendCustomGameEventToServer as any)('equipment_unequip_item', {
            PlayerID: Players.GetLocalPlayer(),
            slot: slot,
        });
        Game.EmitSound('Item.DropGemShop');
    };

    // 使用通货
    const useCurrency = (currencyType: string) => {
        if (! selectedItem) return;
        (GameEvents.SendCustomGameEventToServer as any)('equipment_use_currency', {
            PlayerID: Players.GetLocalPlayer(),
            itemId: selectedItem.id,
            currencyType: currencyType,
        });
        Game.EmitSound('Item.DropGemShop');
    };

    // 丢弃装备
    const discardItem = (item: ItemData) => {
        (GameEvents.SendCustomGameEventToServer as any)('equipment_discard_item', {
            PlayerID: Players.GetLocalPlayer(),
            itemId: item.id,
        });
        Game.EmitSound('General.Cancel');
        setSelectedItem(null);
    };

    // ========== POE风格物品详情组件 ==========
    const ItemTooltip: React.FC<{ item: ItemData; x: number; y: number }> = ({ item, x, y }) => {
        const bgColor = RARITY_BG_COLORS[item.rarity] || '#1a1a1a';
        const borderColor = item.rarityColor || '#555';
        
        return (
            <Panel style={{
                position: 'absolute',
                transform: `translate3d(${x}px, ${y}px, 0px)`,
                width: '320px',
                backgroundColor: bgColor + 'f0',
                border: '2px solid ' + borderColor,
                flowChildren: 'down',
                padding: '0px',
                zIndex: 1000,
            }}>
                {/* 标题栏 */}
                <Panel style={{
                    width: '100%',
                    backgroundColor: borderColor + '40',
                    borderBottom: '1px solid ' + borderColor,
                    padding: '8px 12px',
                    flowChildren: 'down',
                }}>
                    <Label text={item.name} style={{
                        fontSize: '16px',
                        color: item.rarityColor,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        width: '100%',
                    }} />
                    <Label text={item.rarityName + ' ' + item.baseName} style={{
                        fontSize: '12px',
                        color: '#888',
                        textAlign: 'center',
                        width: '100%',
                        marginTop: '2px',
                    }} />
                </Panel>

                {/* 物品等级 */}
                <Panel style={{
                    width: '100%',
                    padding: '6px 12px',
                    borderBottom: '1px solid #333',
                }}>
                    <Label text={'物品等级: ' + item.itemLevel} style={{
                        fontSize: '12px',
                        color: '#888',
                    }} />
                </Panel>

                {/* 前缀 */}
                {item.prefixes && item.prefixes.length > 0 && (
                    <Panel style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderBottom: '1px solid #333',
                        flowChildren: 'down',
                    }}>
                        <Label text="前缀" style={{
                            fontSize: '12px',
                            color: '#888',
                            marginBottom: '6px',
                        }} />
                        {item.prefixes.map((affix, index) => (
                            <AffixRow key={index} affix={affix} />
                        ))}
                    </Panel>
                )}

                {/* 后缀 */}
                {item.suffixes && item.suffixes.length > 0 && (
                    <Panel style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderBottom: '1px solid #333',
                        flowChildren: 'down',
                    }}>
                        <Label text="后缀" style={{
                            fontSize: '12px',
                            color: '#888',
                            marginBottom: '6px',
                        }} />
                        {item.suffixes.map((affix, index) => (
                            <AffixRow key={index} affix={affix} />
                        ))}
                    </Panel>
                )}

                {/* 腐化标记 */}
                {item.corrupted && (
                    <Panel style={{
                        width: '100%',
                        padding: '6px 12px',
                    }}>
                        <Label text="已腐化" style={{
                            fontSize: '12px',
                            color: '#d20000',
                            fontWeight: 'bold',
                        }} />
                    </Panel>
                )}
            </Panel>
        );
    };

    // ========== 词缀行组件 ==========
    const AffixRow: React.FC<{ affix: AffixData }> = ({ affix }) => {
        const tierColor = TIER_COLORS[affix.tier] || '#fff';
        
        return (
            <Panel style={{
                width: '100%',
                flowChildren: 'right',
                marginBottom: '4px',
            }}>
                <Panel style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: tierColor + '40',
                    border: '1px solid ' + tierColor,
                    marginRight: '8px',
                }}>
                    <Label text={'T' + affix.tier} style={{
                        fontSize: '10px',
                        color: tierColor,
                        horizontalAlign: 'center',
                        verticalAlign: 'center',
                    }} />
                </Panel>
                <Label text={affix.description} style={{
                    fontSize: '13px',
                    color: '#7f7f00',
                    fontWeight: 'bold',
                }} />
            </Panel>
        );
    };

    // ========== 装备格子组件 ==========
    const EquipmentSlot: React.FC<{ 
        slot: string; 
        label: string; 
        icon: string;
        item: ItemData | null;
    }> = ({ slot, label, icon, item }) => {
        const hasItem = item !== null;
        const borderColor = hasItem ? (item.rarityColor || '#555') : '#333';
        
        return (
            <Panel
                hittest={true}
                onactivate={() => {
                    if (hasItem) {
                        setSelectedItem(item);
                    }
                }}
                onmouseout={() => setHoveredItem(null)}
                onmouseover={(panel) => {
                    if (hasItem) {
                        setHoveredItem(item);
                        const pos = panel.GetPositionWithinWindow();
                        setTooltipPos({ x: pos.x + 80, y: pos.y });
                    }
                }}
                style={{
                    width: '70px',
                    height: '70px',
                    margin: '4px',
                    backgroundColor: hasItem ? '#1a1a1a' : '#0a0a0a',
                    border: '2px solid ' + borderColor,
                }}
            >
                {hasItem ?  (
                    <Image src={'s2r://panorama/images/items/' + item.baseIcon + '_png.vtex'} style={{
                        width: '100%',
                        height: '100%',
                    }} />
                ) : (
                    <Panel style={{ width: '100%', height: '100%', flowChildren: 'down' }}>
                        <Label text={icon} style={{
                            fontSize: '24px',
                            color: '#333',
                            horizontalAlign: 'center',
                            verticalAlign: 'center',
                        }} />
                        <Label text={label} style={{
                            fontSize: '9px',
                            color: '#444',
                            horizontalAlign: 'center',
                        }} />
                    </Panel>
                )}
            </Panel>
        );
    };

    // ========== 背包格子组件 ==========
    const InventorySlot: React.FC<{ item: ItemData; index: number }> = ({ item, index }) => {
        const isSelected = selectedItem?.id === item.id;
        const borderColor = isSelected ? '#fff' : (item.rarityColor || '#555');
        
        return (
            <Panel
                hittest={true}
                onactivate={() => setSelectedItem(isSelected ? null : item)}
                onmouseout={() => setHoveredItem(null)}
                onmouseover={(panel) => {
                    setHoveredItem(item);
                    const pos = panel.GetPositionWithinWindow();
                    setTooltipPos({ x: pos.x + 60, y: pos.y });
                }}
                style={{
                    width: '55px',
                    height: '55px',
                    margin: '3px',
                    backgroundColor: isSelected ? '#2a2a2a' : '#1a1a1a',
                    border: '2px solid ' + borderColor,
                }}
            >
                <Image src={'s2r://panorama/images/items/' + item.baseIcon + '_png.vtex'} style={{
                    width: '100%',
                    height: '100%',
                }} />
            </Panel>
        );
    };

    // ========== 通货按钮组件 ==========
    const CurrencyButton: React.FC<{
        type: string;
        name: string;
        icon: string;
        count: number;
        description: string;
    }> = ({ type, name, icon, count, description }) => {
        const canUse = selectedItem !== null && count > 0;
        
        return (
            <Panel
                hittest={true}
                onactivate={() => canUse && useCurrency(type)}
                style={{
                    width: '100%',
                    height: '50px',
                    backgroundColor: canUse ? '#1a2a1a' : '#1a1a1a',
                    border: canUse ? '1px solid #4a4' : '1px solid #333',
                    flowChildren: 'right',
                    padding: '5px',
                    marginBottom: '5px',
                    opacity: canUse ? '1.0' : '0.5',
                }}
            >
                <Panel style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#0a0a0a',
                    marginRight: '8px',
                }}>
                    <Image src={'s2r://panorama/images/items/' + icon + '_png.vtex'} style={{
                        width: '100%',
                        height: '100%',
                    }} />
                </Panel>
                <Panel style={{ flowChildren: 'down', width: '140px' }}>
                    <Label text={name + ' x' + count} style={{
                        fontSize: '13px',
                        color: count > 0 ? '#ffd700' : '#666',
                        fontWeight: 'bold',
                    }} />
                    <Label text={description} style={{
                        fontSize: '10px',
                        color: '#888',
                        whiteSpace: 'normal',
                    }} />
                </Panel>
            </Panel>
        );
    };

    // ========== 主界面渲染 ==========
    return (
        <Panel style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000000cc',
        }}>
            <Panel style={{
                width: '1000px',
                height: '700px',
                backgroundColor: '#0d0d0d',
                border: '3px solid #3a3020',
                horizontalAlign: 'center',
                verticalAlign: 'center',
                flowChildren: 'right',
            }}>
                {/* 左侧 - 角色装备 */}
                <Panel style={{
                    width: '280px',
                    height: '100%',
                    backgroundColor: '#0a0a0a',
                    borderRight: '2px solid #2a2a2a',
                    flowChildren: 'down',
                    padding: '15px',
                }}>
                    <Label text="角色装备" style={{
                        fontSize: '18px',
                        color: '#c8b070',
                        fontWeight: 'bold',
                        marginBottom: '15px',
                    }} />
                    
                    {/* 装备格子布局 */}
                    <Panel style={{ flowChildren: 'right', horizontalAlign: 'center', marginBottom: '5px' }}>
                        <EquipmentSlot slot="helmet" label="头盔" icon="⛑️" item={equipped.helmet || null} />
                        <EquipmentSlot slot="amulet" label="项链" icon="📿" item={equipped.amulet || null} />
                    </Panel>
                    
                    <Panel style={{ flowChildren: 'right', horizontalAlign: 'center', marginBottom: '5px' }}>
                        <EquipmentSlot slot="weapon" label="武器" icon="⚔️" item={equipped.weapon || null} />
                        <EquipmentSlot slot="armor" label="护甲" icon="🛡️" item={equipped.armor || null} />
                        <EquipmentSlot slot="gloves" label="手套" icon="🧤" item={equipped.gloves || null} />
                    </Panel>
                    
                    <Panel style={{ flowChildren: 'right', horizontalAlign: 'center', marginBottom: '5px' }}>
                        <EquipmentSlot slot="ring1" label="戒指" icon="💍" item={equipped.ring1 || null} />
                        <EquipmentSlot slot="belt" label="腰带" icon="🎗️" item={equipped.belt || null} />
                        <EquipmentSlot slot="ring2" label="戒指" icon="💍" item={equipped.ring2 || null} />
                    </Panel>
                    
                    <Panel style={{ flowChildren: 'right', horizontalAlign: 'center' }}>
                        <EquipmentSlot slot="boots" label="鞋子" icon="🥾" item={equipped.boots || null} />
                    </Panel>

                    {/* 操作按钮 */}
                    {selectedItem && equipped[selectedItem.slot]?.id === selectedItem.id && (
                        <Panel style={{ marginTop: '20px', horizontalAlign: 'center' }}>
                            <Panel
                                hittest={true}
                                onactivate={() => {
                                    unequipItem(selectedItem.slot);
                                    setSelectedItem(null);
                                }}
                                style={{
                                    width: '120px',
                                    height: '30px',
                                    backgroundColor: '#3a2020',
                                    border: '1px solid #a55',
                                }}
                            >
                                <Label text="卸下装备" style={{
                                    fontSize: '12px',
                                    color: '#faa',
                                    horizontalAlign: 'center',
                                    verticalAlign: 'center',
                                }} />
                            </Panel>
                        </Panel>
                    )}
                </Panel>

                {/* 中间 - 背包 */}
                <Panel style={{
                    width: '420px',
                    height: '100%',
                    backgroundColor: '#0d0d0d',
                    flowChildren: 'down',
                    padding: '15px',
                }}>
                    <Label text="背包" style={{
                        fontSize: '18px',
                        color: '#c8b070',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                    }} />
                    
                    {/* 背包格子 */}
                    <Panel style={{
                        width: '100%',
                        height: '400px',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #2a2a2a',
                       flowChildren: 'right-wrap',
                        padding: '5px',
                        overflow: 'scroll',
                    }}>
                        {inventory.map((item, index) => (
                            <InventorySlot key={item.id} item={item} index={index} />
                        ))}
                        {inventory.length === 0 && (
                            <Label text="背包为空" style={{
                                fontSize: '14px',
                                color: '#555',
                                horizontalAlign: 'center',
                                verticalAlign: 'center',
                                width: '100%',
                                height: '100%',
                                whiteSpace: 'normal',
                            }} />
                        )}
                    </Panel>

                    {/* 选中物品操作 */}
                    {selectedItem && !equipped[selectedItem.slot]?.id && (
                        <Panel style={{
                            marginTop: '15px',
                            flowChildren: 'right',
                            horizontalAlign: 'center',
                        }}>
                            <Panel
                                hittest={true}
                                onactivate={() => equipItem(selectedItem)}
                                style={{
                                    width: '100px',
                                    height: '30px',
                                    backgroundColor: '#203a20',
                                    border: '1px solid #5a5',
                                    marginRight: '10px',
                                }}
                            >
                                <Label text="装备" style={{
                                    fontSize: '12px',
                                    color: '#afa',
                                    horizontalAlign: 'center',
                                    verticalAlign: 'center',
                                }} />
                            </Panel>
                            <Panel
                                hittest={true}
                                onactivate={() => discardItem(selectedItem)}
                                style={{
                                    width: '100px',
                                    height: '30px',
                                    backgroundColor: '#3a2020',
                                    border: '1px solid #a55',
                                }}
                            >
                                <Label text="丢弃" style={{
                                    fontSize: '12px',
                                    color: '#faa',
                                    horizontalAlign: 'center',
                                    verticalAlign: 'center',
                                }} />
                            </Panel>
                        </Panel>
                    )}

                    {/* 选中物品信息 */}
                    {selectedItem && (
                        <Panel style={{
                            marginTop: '15px',
                            width: '100%',
                            backgroundColor: '#0a0a0a',
                            border: '1px solid ' + selectedItem.rarityColor,
                            padding: '10px',
                            flowChildren: 'down',
                        }}>
                            <Label text={selectedItem.name} style={{
                                fontSize: '14px',
                                color: selectedItem.rarityColor,
                                fontWeight: 'bold',
                                marginBottom: '5px',
                            }} />
                            <Label text={selectedItem.rarityName + ' ' + selectedItem.baseName + ' (iLv ' + selectedItem.itemLevel + ')'} style={{
                                fontSize: '11px',
                                color: '#888',
                                whiteSpace: 'normal',
                            }} />
                        </Panel>
                    )}
                </Panel>

                {/* 右侧 - 通货 */}
                <Panel style={{
                    width: '300px',
                    height: '100%',
                    backgroundColor: '#0a0a0a',
                    borderLeft: '2px solid #2a2a2a',
                    flowChildren: 'down',
                    padding: '15px',
                }}>
                    <Label text="通货" style={{
                        fontSize: '18px',
                        color: '#c8b070',
                        fontWeight: 'bold',
                        marginBottom: '15px',
                    }} />
                    
                    <CurrencyButton
                        type="exalted"
                        name="崇高石"
                        icon="item_ultimate_orb"
                        count={currency.exalted}
                        description="增加一条随机词缀"
                    />
                    <CurrencyButton
                        type="chaos"
                        name="混沌石"
                        icon="item_octarine_core"
                        count={currency.chaos}
                        description="重随所有词缀"
                    />
                    <CurrencyButton
                        type="divine"
                        name="神圣石"
                        icon="item_refresher"
                        count={currency.divine}
                        description="重随词缀数值"
                    />

                    {/* 提示 */}
                    <Panel style={{
                        marginTop: '20px',
                        padding: '10px',
                        backgroundColor: '#1a1a0a',
                        border: '1px solid #333',
                    }}>
                        <Label text="选中背包中的稀有装备后点击通货使用" style={{
                            fontSize: '11px',
                            color: '#888',
                            whiteSpace: 'normal',
                        }} />
                    </Panel>

                    {/* 关闭按钮 */}
                    <Panel 
                     hittest={false}
                    style={{ width: '1px', height: '1px', opacity: '0', }} />
                    <Panel
                        hittest={true}
                        onactivate={onClose}
                        style={{
                            width: '100%',
                            height: '40px',
                            backgroundColor: '#2a1a1a',
                            border: '1px solid #555',
                        }}
                    >
                        <Label text="关闭 (ESC)" style={{
                            fontSize: '14px',
                            color: '#aaa',
                            horizontalAlign: 'center',
                            verticalAlign: 'center',
                        }} />
                    </Panel>
                </Panel>
            </Panel>

            {/* 悬浮提示框 */}
            {hoveredItem && (
                <ItemTooltip item={hoveredItem} x={tooltipPos.x} y={tooltipPos.y} />
            )}
        </Panel>
    );
};