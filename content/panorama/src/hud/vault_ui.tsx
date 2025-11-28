import React, { useState, useEffect, useRef } from 'react';

// 装备属性接口
interface EquipmentStat {
    attribute: string;
    value: number;
}

// 装备物品接口
interface ExternalRewardItem {
    name: string;
    type: string;
    icon: string;
    stats: EquipmentStat[];
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
    const [isEquipping, setIsEquipping] = useState(false);  // ⭐ 添加这一行
    const [isOpen, setIsOpen] = useState(true); // 用于管理是否显示仓库页面

    const hoverTimeoutRef = useRef<number | null>(null);
    
    
    // ==================== 数据加载逻辑 ====================
    useEffect(() => {
        if (!visible) return;

        $. Msg('[VaultUI] 界面打开，请求仓库数据');
        
        (GameEvents.SendCustomGameEventToServer as any)('request_vault_data', {
            PlayerID: Players.GetLocalPlayer()
        });

        // 同时请求装备数据用于对比
        (GameEvents.SendCustomGameEventToServer as any)('request_equipment_data', {
            PlayerID: Players.GetLocalPlayer(),
        });

const vaultListener = GameEvents.Subscribe('update_vault_ui', (data: any) => {
    $.Msg('[VaultUI] 收到仓库数据:', data);
    
    const items: ExternalRewardItem[] = [];
    if (data. items) {
        if (Array.isArray(data.items)) {
            // 如果是数组，直接使用
            items.push(...data.items. map((item: { stats: any; }) => ({
                ... item,
                stats: Array.isArray(item.stats) ? item.stats : Object.values(item.stats || {})
            })));
        } else if (typeof data.items === 'object') {
            // 如果是对象，转为数组
            for (const key in data.items) {
                const item = data.items[key];
                
                // ⭐ 关键：将 stats 对象转为数组
                const statsArray = Array.isArray(item.stats) 
                    ? item.stats 
                    : Object.values(item.stats || {});
                
                items.push({
                    ...item,
                    stats: statsArray  // ✅ 保证 stats 是数组
                });
            }
        }
    }
    
    setVaultItems(items);
    $. Msg(`[VaultUI] 显示 ${items.length} 件装备`);
});


const equipmentListener = GameEvents. Subscribe('update_equipment_ui', (data: any) => {
    $. Msg('[VaultUI] 收到装备数据:', data);
    
    // ⭐ 转换装备数据，确保 stats 是数组
    const processedEquipment: Record<string, ExternalRewardItem | null> = {};
    
    for (const slot in data.equipment) {
        const item = data.  equipment[slot];
        
        if (item) {
            // 将 stats 对象转为数组
            const statsArray = Array.isArray(item.stats) 
                ?   item.stats 
                : Object.values(item.stats || {});
            
            processedEquipment[slot] = {
                ...item,
                stats: statsArray  // ✅ 保证 stats 是数组
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
    // ⭐ 防止重复点击
    if (isEquipping) {
        $. Msg('[VaultUI] ⚠️ 正在装备中，请稍候...');
        return;
    }
    
    $.Msg(`[VaultUI] 装备索引 ${index} 的装备`);
    
    // ⭐ 设置装备中状态
    setIsEquipping(true);
    
    (GameEvents.SendCustomGameEventToServer as any)('equip_item_from_vault', {
        PlayerID: Players.GetLocalPlayer(),
        index: index
    });

    Game.EmitSound('ui.crafting_gem_create');
    
    // 装备后关闭确认框
    setSelectedItem(null);
    setHoveredItem(null);
    
    // ⭐ 1. 5 秒后解除锁定
    setTimeout(() => {
        setIsEquipping(false);
        $. Msg('[VaultUI] 解除装备锁定');
    }, 1500);
};

    // 查找当前已装备的同类型装备
    const findEquippedItemByType = (itemType: string): ExternalRewardItem | null => {
        for (const slot in equippedItems) {
            const equipped = equippedItems[slot];
            if (equipped && equipped. type === itemType) {
                return equipped;
            }
        }
        return null;
    };

    // 处理悬停事件
    const handleMouseOver = (index: number, item: ExternalRewardItem) => {
        // 清除之前的延迟
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        // 立即设置悬停项
        setHoveredItem(index);
        
        // 查找对应的已装备物品
        const equipped = findEquippedItemByType(item.type);
        setCompareEquipment(equipped);
    };

    // 处理鼠标移出
    const handleMouseOut = () => {
        // 延迟隐藏对比面板，给用户时间移动鼠标
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredItem(null);
            setCompareEquipment(null);
        }, 300) as any;
    };

    // 保持对比面板显示
    const keepComparePanel = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    if (!visible) return null;

    // 网格配置：8列 x 5行 = 40个格子
    const COLUMNS = 8;
    const ROWS = 5;
    const TOTAL_SLOTS = COLUMNS * ROWS;
    const emptySlots = TOTAL_SLOTS - vaultItems.length;

    // ==================== 获取物品品质颜色 ====================
    const getQualityColor = (item: ExternalRewardItem): string => {
        // 根据属性总和计算品质
        const totalValue = item.stats.reduce((sum, stat) => sum + stat. value, 0);
        
        if (totalValue >= 50) return '#ff8000';  // 橙色 - 传说
        if (totalValue >= 35) return '#a335ee';  // 紫色 - 史诗
        if (totalValue >= 20) return '#0070dd';  // 蓝色 - 稀有
        if (totalValue >= 10) return '#1eff00';  // 绿色 - 优秀
        return '#9d9d9d';                        // 灰色 - 普通
    };

    const hoveredItemData = hoveredItem !== null ? vaultItems[hoveredItem] : null;

    return (
        /* 全屏背景遮罩 */
       <Panel style={{
        width: '740px',
        height: '520px',
        horizontalAlign: 'center',
        verticalAlign: 'center',
        backgroundColor: '#1c1410',
        border: '4px solid #8b7355',
        flowChildren: 'down',
    }}>
            {/* 主容器 */}
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
                    {/* 弹性空间 */}
                    <Panel style={{ width: 'fill-parent-flow(1)', height: '1px' }} />
                    {/* 关闭按钮 */}
                    <Button 
                        onactivate={onClose}
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#8b0000',
                            border: '2px solid #ff0000',
                        }}
                        onmouseover={(panel) => {
                            panel. style.backgroundColor = '#b22222';
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
                    {/* 已有物品 */}
                    {vaultItems.map((item, index) => {
                        const qualityColor = getQualityColor(item);
                        const normalBorder = `3px solid ${qualityColor}`;
                        const hoverBorder = `4px solid ${qualityColor}`;
                        const isHovered = hoveredItem === index;
                        
                        return (
                            <Panel 
                                key={`item-${index}`}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '2px',
                                    backgroundColor: isHovered ? '#1a1a1a' : '#0a0a0a',
                                    border: isHovered ? hoverBorder : normalBorder,
                                    backgroundImage: `url("${item.icon}")`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                                onactivate={() => {
                                    Game.EmitSound('ui.button_click');
                                    setSelectedItem(index);
                                }}
                                onmouseover={() => {
                                    handleMouseOver(index, item);
                                    Game.EmitSound('ui. button_over');
                                }}
                                onmouseout={() => {
                                    handleMouseOut();
                                }}
                            >
                                {/* 选中高亮 */}
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

                    {/* 空格子 */}
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
            </Panel>

            {/* ⭐ 装备对比 Tooltip（支持滚动和多属性） */}
            {hoveredItem !== null && hoveredItemData && (
                <Panel 
                    style={{
                        width: '450px',
                        maxHeight: '700px',
                        backgroundColor: '#1a1a1aee',
                        border: '4px solid #ffd700',
                        padding: '20px',
                        horizontalAlign: 'left',
                        verticalAlign: 'top',
                        marginLeft: '20px',
                        marginTop: '100px',
                        zIndex: 200,
                        flowChildren: 'down',
                        overflow: 'squish scroll',  // 启用滚动
                    }}
                    onmouseover={keepComparePanel}
                    onmouseout={handleMouseOut}
                >
                    {/* 标题 */}
                    <Label 
                        text="📊 装备对比"
                        style={{
                            fontSize: '24px',
                            color: '#ffd700',
                            textAlign: 'center',
                            marginBottom: '15px',
                            fontWeight: 'bold',
                        }}
                    />

                    {/* 待装备物品 */}
                    <Panel style={{
                        width: '100%',
                        backgroundColor: '#0a0a0a',
                        border: `3px solid ${getQualityColor(hoveredItemData)}`,
                        padding: '15px',
                        marginBottom: '15px',
                        flowChildren: 'down',
                    }}>
                        <Label 
                            text="【待装备】"
                            style={{ fontSize: '14px', color: '#00ff00', marginBottom: '8px' }}
                        />
                        <Panel style={{ width: '100%', flowChildren: 'right', marginBottom: '10px' }}>
                            <Panel style={{
                                width: '60px',
                                height: '60px',
                                backgroundImage: `url("${hoveredItemData.icon}")`,
                                backgroundSize: 'cover',
                                marginRight: '10px',
                            }} />
                            <Panel style={{ flowChildren: 'down', width: '100%' }}>
                                <Label 
                                    text={hoveredItemData.name}
                                    style={{
                                        fontSize: '18px',
                                        color: getQualityColor(hoveredItemData),
                                        fontWeight: 'bold',
                                        marginBottom: '5px',
                                    }}
                                />
                                <Label 
                                    text={hoveredItemData.type}
                                    style={{ fontSize: '14px', color: '#ffd700', marginBottom: '8px' }}
                                />
                                
                                {/* 显示多个属性 */}
                                {hoveredItemData.stats.map((stat, index) => (
                                    <Label 
                                        key={index}
                                        text={`+${stat.value} ${stat.attribute}`}
                                        style={{ 
                                            fontSize: '15px', 
                                            color: '#00ff00', 
                                            fontWeight: 'bold',
                                            marginBottom: '3px'
                                        }}
                                    />
                                ))}
                            </Panel>
                        </Panel>
                    </Panel>

                    {/* 分隔线 */}
                    <Panel style={{
                        width: '100%',
                        height: '2px',
                        backgroundColor: '#555555',
                        marginBottom: '15px',
                    }} />

                    {/* 当前已装备 */}
                    {compareEquipment ?  (
                        <>
                            <Panel style={{
                                width: '100%',
                                backgroundColor: '#0a0a0a',
                                border: `3px solid ${getQualityColor(compareEquipment)}`,
                                padding: '15px',
                                marginBottom: '15px',
                                flowChildren: 'down',
                            }}>
                                <Label 
                                    text="【当前装备】"
                                    style={{ fontSize: '14px', color: '#888888', marginBottom: '8px' }}
                                />
                                <Panel style={{ width: '100%', flowChildren: 'right', marginBottom: '10px' }}>
                                    <Panel style={{
                                        width: '60px',
                                        height: '60px',
                                        backgroundImage: `url("${compareEquipment.icon}")`,
                                        backgroundSize: 'cover',
                                        marginRight: '10px',
                                    }} />
                                    <Panel style={{ flowChildren: 'down', width: '100%' }}>
                                        <Label 
                                            text={compareEquipment.name}
                                            style={{
                                                fontSize: '18px',
                                                color: getQualityColor(compareEquipment),
                                                fontWeight: 'bold',
                                                marginBottom: '5px',
                                            }}
                                        />
                                        <Label 
                                            text={compareEquipment.type}
                                            style={{ fontSize: '14px', color: '#ffd700', marginBottom: '8px' }}
                                        />
                                        
                                        {/* 显示多个属性 */}
                                        {compareEquipment.stats.map((stat, index) => (
                                            <Label 
                                                key={index}
                                                text={`+${stat. value} ${stat.attribute}`}
                                                style={{ 
                                                    fontSize: '15px', 
                                                    color: '#00ff00', 
                                                    fontWeight: 'bold',
                                                    marginBottom: '3px'
                                                }}
                                            />
                                        ))}
                                    </Panel>
                                </Panel>
                            </Panel>

                            {/* 属性对比（支持多属性） */}
                            <Panel style={{
                                width: '100%',
                                backgroundColor: '#2a2a2a',
                                padding: '15px',
                                flowChildren: 'down',
                            }}>
                                <Label 
                                    text="📈 属性变化"
                                    style={{
                                        fontSize: '18px',
                                        color: '#ffd700',
                                        marginBottom: '10px',
                                        fontWeight: 'bold',
                                    }}
                                />
                                
                                {/* 计算并显示每个属性的变化 */}
                                {(() => {
                                    // 合并两个装备的所有属性
                                    const allAttributes = new Set<string>();
                                    hoveredItemData.stats.forEach(stat => allAttributes.add(stat.attribute));
                                    compareEquipment.stats.forEach(stat => allAttributes.add(stat.attribute));
                                    
                                    // 计算每个属性的差异
                                    const attributeDiffs: Array<{ attr: string, oldVal: number, newVal: number, diff: number }> = [];
                                    
                                    allAttributes.forEach(attr => {
                                        const oldStat = compareEquipment.stats.find(s => s.attribute === attr);
                                        const newStat = hoveredItemData.stats. find(s => s.attribute === attr);
                                        
                                        const oldVal = oldStat ? oldStat.value : 0;
                                        const newVal = newStat ? newStat.value : 0;
                                        const diff = newVal - oldVal;
                                        
                                        if (diff !== 0) {
                                            attributeDiffs.push({ attr, oldVal, newVal, diff });
                                        }
                                    });
                                    
                                    return attributeDiffs.map((item, index) => {
                                        const isUpgrade = item.diff > 0;
                                        const diffColor = isUpgrade ? '#00ff00' : '#ff0000';
                                        const diffSymbol = isUpgrade ? '↑' : '↓';
                                        
                                        return (
                                            <Panel key={index} style={{ 
                                                width: '100%', 
                                                marginBottom: '8px',
                                                flowChildren: 'down'
                                            }}>
                                                <Label 
                                                    text={`${item.attr}: ${diffSymbol} ${Math.abs(item.diff)}`}
                                                    style={{
                                                        fontSize: '17px',
                                                        color: diffColor,
                                                        fontWeight: 'bold',
                                                    }}
                                                />
                                                <Label 
                                                    text={`${item.oldVal} → ${item.newVal}`}
                                                    style={{
                                                        fontSize: '13px',
                                                        color: '#cccccc',
                                                        marginTop: '2px',
                                                    }}
                                                />
                                            </Panel>
                                        );
                                    });
                                })()}
                            </Panel>
                        </>
                    ) : (
                        <Panel style={{
                            width: '100%',
                            backgroundColor: '#2a2a2a',
                            padding: '20px',
                            flowChildren: 'down',
                        }}>
                            <Label 
                                text="✨ 当前未装备同类型装备"
                                style={{
                                    fontSize: '16px',
                                    color: '#888888',
                                    textAlign: 'center',
                                }}
                            />
                            <Label 
                                text="装备后将获得以下属性："
                                style={{
                                    fontSize: '14px',
                                    color: '#ffd700',
                                    textAlign: 'center',
                                    marginTop: '10px',
                                    marginBottom: '10px',
                                }}
                            />
                            {hoveredItemData.stats.map((stat, index) => (
                                <Label 
                                    key={index}
                                    text={`+${stat.value} ${stat.attribute}`}
                                    style={{
                                        fontSize: '16px',
                                        color: '#00ff00',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        marginBottom: '5px',
                                    }}
                                />
                            ))}
                        </Panel>
                    )}
                </Panel>
            )}

            {/* 装备确认面板 */}
            {selectedItem !== null && vaultItems[selectedItem] && (() => {
                const item = vaultItems[selectedItem];
                const qualityColor = getQualityColor(item);
                
                return (
                    <Panel style={{
                        width: '500px',
                        backgroundColor: '#1a1a1aee',
                        border: '4px solid #ffd700',
                        padding: '30px',
                        horizontalAlign: 'center',
                        verticalAlign: 'center',
                        zIndex: 300,
                        flowChildren: 'down',
                    }}>
                        {/* 标题 */}
                        <Label 
                            text="装备这件物品？"
                            style={{
                                fontSize: '32px',
                                color: '#ffd700',
                                textAlign: 'center',
                                marginBottom: '30px',
                                fontWeight: 'bold',
                            }}
                        />
                        
                        {/* 装备信息卡片 */}
                        <Panel style={{
                            width: '100%',
                            backgroundColor: '#0a0a0a',
                            border: `3px solid ${qualityColor}`,
                            padding: '25px',
                            marginBottom: '35px',
                            flowChildren: 'down',
                        }}>
                            {/* 装备图标 */}
                            <Panel style={{
                                width: '100%',
                                horizontalAlign: 'center',
                                marginBottom: '20px',
                            }}>
                                <Image 
                                    src={item.icon}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                    }}
                                />
                            </Panel>
                            
                            {/* 装备名称 */}
                            <Label 
                                text={item. name}
                                style={{
                                    fontSize: '28px',
                                    color: qualityColor,
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    marginBottom: '12px',
                                }}
                            />
                            
                            {/* 装备类型 */}
                            <Label 
                                text={item.type}
                                style={{
                                    fontSize: '22px',
                                    color: '#ffd700',
                                    textAlign: 'center',
                                    marginBottom: '20px',
                                }}
                            />
                            
                            {/* 分隔线 */}
                            <Panel style={{
                                width: '100%',
                                height: '2px',
                                backgroundColor: '#555555',
                                marginBottom: '20px',
                            }} />
                            
                            {/* 装备属性（多个） */}
                            {item.stats.map((stat, index) => (
                                <Label 
                                    key={index}
                                    text={`+${stat.value} ${stat.attribute}`}
                                    style={{
                                        fontSize: '24px',
                                        color: '#00ff00',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        marginBottom: '8px',
                                    }}
                                />
                            ))}
                        </Panel>
                        
                        {/* 按钮区域 */}
                        <Panel style={{
                            width: '100%',
                            flowChildren: 'down',
                        }}>
                            {/* 确认按钮 */}
                            <Button 
    onactivate={() => onEquipItem(selectedItem)}
    style={{
        width: '100%',
        height: '60px',
        backgroundColor: isEquipping ? '#888888' : '#4caf50',  // ⭐ 装备中显示灰色
        marginBottom: '15px',
        opacity:isEquipping ? '0.5' : '1',  // ⭐ 装备中半透明
    }}
    onmouseover={(panel) => {
        if (!isEquipping) {  // ⭐ 装备中不响应 hover
            panel.style.backgroundColor = '#66bb6a';
        }
    }}
    onmouseout={(panel) => {
        if (!  isEquipping) {
            panel.style.backgroundColor = '#4caf50';
        }
    }}
>
    <Label 
        text={isEquipping ?  "⏳ 装备中..." : "✔ 确认装备"}  // ⭐ 动态文本
        style={{ fontSize: '26px', color: 'white', textAlign: 'center', fontWeight: 'bold' }} 
    />
</Button>
                            
                            {/* 取消按钮 */}
                            <Button 
                                onactivate={() => setSelectedItem(null)}
                                style={{
                                    width: '100%',
                                    height: '60px',
                                    backgroundColor: '#888888',
                                }}
                                onmouseover={(panel) => {
                                    panel.style.backgroundColor = '#aaaaaa';
                                }}
                                onmouseout={(panel) => {
                                    panel.style.backgroundColor = '#888888';
                                }}
                            >
                                <Label text="✕ 取消" style={{ fontSize: '26px', color: 'white', textAlign: 'center', fontWeight: 'bold' }} />
                            </Button>
                        </Panel>
                    </Panel>
                );
            })()}
        </Panel>
    );
};