import React, { useState, useEffect } from 'react';

// 装备槽位枚举
enum EquipmentSlot {
    HELMET = 'helmet',      // 头盔
    NECKLACE = 'necklace',  // 项链
    RING = 'ring',          // 戒指
    TRINKET = 'trinket',    // 饰品
    WEAPON = 'weapon',      // 武器
    ARMOR = 'armor',        // 护甲
    BELT = 'belt',          // 腰带
    BOOTS = 'boots',        // 鞋子
}

interface EquippedItem {
    name: string;
    type: string;
    icon: string;
    attribute: string;
    value: number;
}

interface EquipmentUIProps {
    visible: boolean;
    onClose: () => void;
}

export const EquipmentUI: React.FC<EquipmentUIProps> = ({ visible, onClose }) => {
    // 默认槽初始化
    const initialSlots: Record<string, EquippedItem | null> = {
        helmet: null,
        necklace: null,
        ring: null,
        trinket: null,
        weapon: null,
        armor: null,
        belt: null,
        boots: null,
    };

    const [equippedItems, setEquippedItems] = useState<Record<string, EquippedItem | null>>(initialSlots);

     // 加载装备数据
    useEffect(() => {
        if (!visible) return;

        $.Msg('[EquipmentUI] 请求装备数据');
        
        (GameEvents.SendCustomGameEventToServer as any)('request_equipment_data', {
            PlayerID: Players.GetLocalPlayer(),
        });

        const listener = GameEvents.Subscribe('update_equipment_ui', (data: any) => {
            $.Msg('[EquipmentUI] 收到装备数据:', data);

            // 确保数据格式安全，即便装备槽数据不完整也能渲染
            const updatedEquipment: Record<string, EquippedItem | null> = {
                ...initialSlots,
                ...data.equipment,
            };
            setEquippedItems(updatedEquipment);
        });

        return () => {
            GameEvents.Unsubscribe(listener);
        };
    }, [visible]);

    // 卸下装备
    const unequipItem = (slot: string) => {
        $. Msg(`[EquipmentUI] 卸下装备槽位: ${slot}`);
        
        (GameEvents.SendCustomGameEventToServer as any)('unequip_item', {
            PlayerID: Players.GetLocalPlayer(),
            slot: slot
        });

        Game.EmitSound('ui. crafting_gem_create');
    };

    if (!visible) return null;

    // 获取品质颜色
    const getQualityColor = (item: EquippedItem): string => {
        if (item.value >= 15) return '#ff8000';
        if (item.value >= 12) return '#a335ee';
        if (item.value >= 8) return '#0070dd';
        if (item.value >= 5) return '#1eff00';
        return '#9d9d9d';
    };

    // 渲染装备槽位
    const renderSlot = (slotName: string, slotLabel: string) => {
        const item = equippedItems[slotName];
        const hasItem = item !== null;
        
        return (
            <Panel 
                key={slotName}
                style={{
                    width: '200px',
                    height: '100px',
                    margin: '10px',
                    backgroundColor: hasItem ? '#1a1a1a' : '#0a0a0a',
                    border: hasItem ? `3px solid ${getQualityColor(item!)}` : '2px solid #3a3a3a',
                    flowChildren: 'right',
                    padding: '10px',
                }}
                onactivate={() => {
                    if (hasItem) {
                        unequipItem(slotName);
                    }
                }}
                onmouseover={(panel) => {
                    if (hasItem) {
                        panel.style.backgroundColor = '#2a2a2a';
                        Game.EmitSound('ui.button_over');
                    }
                }}
                onmouseout={(panel) => {
                    if (hasItem) {
                        panel.style.backgroundColor = '#1a1a1a';
                    }
                }}
            >
                {/* 槽位图标 */}
                <Panel style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #555555',
                    backgroundImage: hasItem ? `url("${item!.icon}")` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}>
                    {!hasItem && (
                        <Label 
                            text={getSlotIcon(slotName)}
                            style={{
                                fontSize: '40px',
                                color: '#555555',
                                textAlign: 'center',
                                horizontalAlign: 'center',
                                verticalAlign: 'center',
                            }}
                        />
                    )}
                </Panel>

                {/* 装备信息 */}
                <Panel style={{
                    width: '100px',
                    height: '80px',
                    marginLeft: '10px',
                    flowChildren: 'down',
                }}>
                    <Label 
                        text={hasItem ? item!.name : slotLabel}
                        style={{
                            fontSize: hasItem ? '18px' : '16px',
                            color: hasItem ? getQualityColor(item!) : '#666666',
                            fontWeight: hasItem ? 'bold' : 'normal',
                            marginBottom: '5px',
                        }}
                    />
                    {hasItem && (
                        <>
                            <Label 
                                text={`+${item!.value} ${item!.attribute}`}
                                style={{
                                    fontSize: '16px',
                                    color: '#00ff00',
                                    marginBottom: '5px',
                                }}
                            />
                            <Label 
                                text="点击卸下"
                                style={{
                                    fontSize: '12px',
                                    color: '#888888',
                                    fontStyle: 'italic',
                                }}
                            />
                        </>
                    )}
                </Panel>
            </Panel>
        );
    };

    // 获取槽位图标
    const getSlotIcon = (slot: string): string => {
        const icons: Record<string, string> = {
            helmet: '⛑️',
            necklace: '📿',
            ring: '💍',
            trinket: '✨',
            weapon: '⚔️',
            armor: '🛡️',
            belt: '🎗️',
            boots: '🥾',
        };
        return icons[slot] || '?';
    };

    // 计算总属性
    const getTotalStats = () => {
        const stats: Record<string, number> = {};
        Object.values(equippedItems).forEach(item => {
            if (item) {
                stats[item.attribute] = (stats[item.attribute] || 0) + item.value;
            }
        });
        return stats;
    };

    const totalStats = getTotalStats();

    return (
        <Panel 
            style={{
                width: '100%',
                height: '100%',
                horizontalAlign: 'center',
                verticalAlign: 'center',
                zIndex: 100,
                backgroundColor: '#000000cc',
            }}
            onactivate={onClose}
        >
            {/* 主容器 */}
            <Panel 
                style={{
                    width: '900px',
                    height: '700px',
                    horizontalAlign: 'center',
                    verticalAlign: 'center',
                    backgroundColor: '#1c1410',
                    border: '4px solid #8b7355',
                    flowChildren: 'down',
                }}
                onactivate={() => {}}
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
                        text="⚔️ 人物装备" 
                        style={{
                            fontSize: '32px',
                            color: '#ffd700',
                            fontWeight: 'bold',
                        }}
                    />
                    <Panel style={{ width: '100%', height: '1px' }} />
                    <Button 
                        onactivate={onClose}
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#8b0000',
                            border: '2px solid #ff0000',
                        }}
                    >
                        <Label text="✕" style={{ fontSize: '28px', color: 'white', textAlign: 'center' }} />
                    </Button>
                </Panel>

                {/* 装备区域 */}
                <Panel style={{ width: '100%', height: '640px', padding: '20px', flowChildren: 'right' }}>
                    {/* 左侧槽位 */}
                    <Panel style={{ width: '250px', height: '100%', flowChildren: 'down' }}>
                        {renderSlot('helmet', '头盔')}
                        {renderSlot('necklace', '项链')}
                        {renderSlot('ring', '戒指')}
                        {renderSlot('trinket', '饰品')}
                    </Panel>

                    {/* 中角色部分 */}
                    <Panel style={{
                        width: '350px',
                        height: '100%',
                        flowChildren: 'down',
                        padding: '20px',
                    }}>
                        <Label text="总属性加成" style={{ fontSize: '20px', marginBottom: '20px' }} />
                        {Object.entries(totalStats).map(([attr, value]) => (
                            <Label key={attr} text={`${attr}: +${value}`} />
                        ))}
                        <Panel style={{
                            width: '100%',
                            height: '300px',
                            backgroundColor: '#0a0a0a',
                            border: '2px solid #555555',
                        }}>
                            <Label text="🦸" style={{ fontSize: '120px', textAlign: 'center' }} />
                        </Panel>
                    </Panel>

                    {/* 右侧槽位 */}
                    <Panel style={{ width: '250px', height: '100%', flowChildren: 'down' }}>
                        {renderSlot('weapon', '武器')}
                        {renderSlot('armor', '护甲')}
                        {renderSlot('belt', '腰带')}
                        {renderSlot('boots', '鞋子')}
                    </Panel>
                </Panel>
            </Panel>
        </Panel>
    );
};