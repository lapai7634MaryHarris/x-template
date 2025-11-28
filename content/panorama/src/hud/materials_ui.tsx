import React, { useState, useEffect } from 'react';

// 材料物品接口
interface MaterialItem {
    type: string;
    name: string;
    icon: string;
    color: string;
    count: number;
}

interface MaterialsUIProps {
    visible: boolean;
    onClose: () => void;
}

export const MaterialsUI: React.FC<MaterialsUIProps> = ({ visible, onClose }) => {
    const [materials, setMaterials] = useState<MaterialItem[]>([]);

    // ==================== 数据加载逻辑 ====================
    useEffect(() => {
        if (! visible) return;

        $. Msg('[MaterialsUI] 界面打开，请求材料数据');

        // 请求材料数据
        (GameEvents.SendCustomGameEventToServer as any)('request_materials_data', {
            PlayerID: Players.GetLocalPlayer()
        });

        // 监听材料数据更新
        const materialsListener = GameEvents.Subscribe('update_materials_ui', (data: any) => {
            $. Msg('[MaterialsUI] 收到材料数据:', data);

            const items: MaterialItem[] = [];
            if (data.materials) {
                if (Array.isArray(data.materials)) {
                    items.push(...data.materials);
                } else if (typeof data.materials === 'object') {
                    for (const key in data.materials) {
                        items.push(data.materials[key]);
                    }
                }
            }

            setMaterials(items);
            $. Msg(`[MaterialsUI] 显示 ${items.length} 种材料`);
        });

        return () => {
            GameEvents.Unsubscribe(materialsListener);
        };
    }, [visible]);

    if (!visible) return null;

    // 获取材料稀有度颜色
    const getMaterialColor = (item: MaterialItem): string => {
        return item.color || '#ffffff';
    };

    return (
        <Panel
            style={{
                width: '280px',
                height: '520px',
                backgroundColor: '#1c1410',
                border: '4px solid #8b7355',
                flowChildren: 'down',
                  horizontalAlign: 'right',
            verticalAlign: 'center',
            marginRight: '20px',
            }}
        >
            {/* 标题栏 */}
            <Panel
                style={{
                    width: '100%',
                    height: '60px',
                    backgroundColor: '#2a1f1a',
                    borderBottom: '3px solid #8b7355',
                    flowChildren: 'right',
                    padding: '10px 15px',
                }}
            >
                <Label
                    text="📦 材料背包"
                    style={{
                        fontSize: '24px',
                        color: '#ffd700',
                        fontWeight: 'bold',
                    }}
                />
                {/* 弹性空间 */}
                <Panel style={{ width: 'fill-parent-flow(1)', height: '1px' }} />
                {/* 关闭按钮 */}
                <Button
                    onactivate={onClose}
                    style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#8b0000',
                        border: '2px solid #ff0000',
                    }}
                    onmouseover={(panel) => {
                        panel.style.backgroundColor = '#b22222';
                    }}
                    onmouseout={(panel) => {
                        panel. style.backgroundColor = '#8b0000';
                    }}
                >
                    <Label text="✕" style={{ fontSize: '24px', color: 'white', textAlign: 'center' }} />
                </Button>
            </Panel>

            {/* 材料列表 */}
            <Panel
                style={{
                    width: '100%',
                    height: '460px',
                    padding: '10px',
                    flowChildren: 'down',
                    overflow: 'squish scroll', // 支持滚动
                }}
            >
                {materials.length === 0 ? (
                    <Label
                        text="暂无材料"
                        style={{
                            fontSize: '18px',
                            color: '#888888',
                            textAlign: 'center',
                            marginTop: '20px',
                        }}
                    />
                ) : (
                    materials.map((item, index) => (
                        <Panel
                            key={`material-${index}`}
                            style={{
                                width: '100%',
                                height: '50px',
                                backgroundColor: '#0a0a0a',
                                border: `2px solid ${getMaterialColor(item)}`,
                                marginBottom: '5px',
                                flowChildren: 'right',
                                padding: '5px',
                            }}
                            onmouseover={(panel) => {
                                panel.style.backgroundColor = '#1a1a1a';
                            }}
                            onmouseout={(panel) => {
                                panel.style.backgroundColor = '#0a0a0a';
                            }}
                        >
                            {/* 材料图标 */}
                            <Image
                                src={item.icon}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    marginRight: '10px',
                                }}
                            />
                            {/* 材料名称 */}
                            <Label
                                text={item.name}
                                style={{
                                    fontSize: '16px',
                                    color: getMaterialColor(item),
                                    fontWeight: 'bold',
                                    marginTop: '10px',
                                }}
                            />
                            {/* 弹性空间 */}
                            <Panel style={{ width: 'fill-parent-flow(1)', height: '1px' }} />
                            {/* 材料数量 */}
                            <Label
                                text={`x${item.count}`}
                                style={{
                                    fontSize: '18px',
                                    color: '#ffffff',
                                    fontWeight: 'bold',
                                    marginTop: '10px',
                                    marginRight: '5px',
                                }}
                            />
                        </Panel>
                    ))
                )}
            </Panel>
        </Panel>
    );
};