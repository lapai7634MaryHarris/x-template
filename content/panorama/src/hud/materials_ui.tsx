import React, { useState, useEffect, useRef } from 'react';

// 材料物品接口
interface MaterialItem {
    type: string;
    name: string;
    icon: string;
    color: string;
    count: number;
    category?: string;
    description?: string;
    usable?: boolean;
}

interface MaterialsUIProps {
    visible: boolean;
    onClose: () => void;
}

export const MaterialsUI: React.FC<MaterialsUIProps> = ({ visible, onClose }) => {
    const [materials, setMaterials] = useState<MaterialItem[]>([]);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [isUsing, setIsUsing] = useState(false);

    // ⭐ 新增: 悬停延迟隐藏的 ref
    const hoverTimeoutRef = useRef<number | null>(null);
    
    // ⭐ 新增: 使用防抖时间戳
    const lastUseTimeRef = useRef<number>(0);
    const USE_DEBOUNCE_MS = 200; // 防抖时间 0.2秒

    useEffect(() => {
        if (! visible) return;

        const playerId = Players.GetLocalPlayer();
        
        const convertToArray = (data: any): MaterialItem[] => {
            if (!data || ! data.items) return [];
            
            const items = data.items;
            
            if (Array.isArray(items)) {
                return items;
            }
            
            const result: MaterialItem[] = [];
            for (const key in items) {
                if (items[key]) {
                    result.push(items[key]);
                }
            }
            return result;
        };
        
        const loadMaterials = () => {
            const data = CustomNetTables.GetTableValue('player_materials', playerId. toString());
            const items = convertToArray(data);
            setMaterials(items);
        };
        
        loadMaterials();
        
        const listener = CustomNetTables. SubscribeNetTableListener('player_materials', (_, key, value) => {
            if (key === playerId.toString()) {
                const items = convertToArray(value);
                setMaterials(items);
            }
        });

        // 监听材料使用结果
        const useListener = GameEvents.Subscribe('material_used', (data: any) => {
            setIsUsing(false);
            if (data. success) {
                Game.EmitSound('ui.crafting_gem_create');
            }
        });

        return () => {
            CustomNetTables.UnsubscribeNetTableListener(listener);
            GameEvents.Unsubscribe(useListener);
            // ⭐ 清理悬停定时器
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, [visible]);

    // ⭐ 修改: 使用材料 - 增加防抖功能
    const useMaterial = (item: MaterialItem) => {
        if (!item.usable || isUsing) return;
        
        // ⭐ 防抖检查: 距离上次使用是否超过 0.2秒
        const now = Date.now();
        if (now - lastUseTimeRef.current < USE_DEBOUNCE_MS) {
            $. Msg('[MaterialsUI] 操作过快，请稍候');
            return;
        }
        lastUseTimeRef. current = now;
        
        setIsUsing(true);
        
        (GameEvents.SendCustomGameEventToServer as any)('use_material', {
            PlayerID: Players.GetLocalPlayer(),
            materialType: item.type
        });
        
        Game.EmitSound('ui.button_click');
        
        // 超时自动解锁
        setTimeout(() => {
            setIsUsing(false);
        }, 2000);
    };

    // ⭐ 新增: 悬停处理函数
    const handleMouseOver = (index: number) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setHoveredIndex(index);
    };

    // ⭐ 新增: 离开悬停处理函数
    const handleMouseOut = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredIndex(null);
        }, 200) as any; // 0.2秒延迟隐藏
    };

    // ⭐ 新增: 保持悬停面板显示
    const keepHoverPanel = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    if (!visible) return null;

    // 分类名称
    const getCategoryName = (category: string): string => {
        if (category === "exchange") return "🔸 兑换材料";
        if (category === "craft") return "🔧 打造材料";
        if (category === "ticket") return "🎫 门票";
        if (category === "chest") return "🎁 宝箱";
        return "📦 其他";
    };

    // 按分类分组
    const groupedMaterials: Record<string, MaterialItem[]> = {};
    for (let i = 0; i < materials.length; i++) {
        const item = materials[i];
        const cat = item.category || "exchange";
        if (!groupedMaterials[cat]) {
            groupedMaterials[cat] = [];
        }
        groupedMaterials[cat].push(item);
    }

    // 分类顺序
    const categoryOrder = ["exchange", "craft", "ticket", "chest"];
    const categories: string[] = [];
    for (let i = 0; i < categoryOrder.length; i++) {
        if (groupedMaterials[categoryOrder[i]] && groupedMaterials[categoryOrder[i]].length > 0) {
            categories.push(categoryOrder[i]);
        }
    }

    // 计算全局索引
    let globalIndex = 0;

    // 获取悬停的材料
    const getHoveredItem = (): MaterialItem | null => {
        if (hoveredIndex === null) return null;
        let idx = 0;
        for (let c = 0; c < categories.length; c++) {
            const items = groupedMaterials[categories[c]];
            for (let i = 0; i < items.length; i++) {
                if (idx === hoveredIndex) {
                    return items[i];
                }
                idx++;
            }
        }
        return null;
    };

    const hoveredItem = getHoveredItem();

    // 渲染单个材料
    const renderMaterial = (item: MaterialItem, index: number) => {
        const isHovered = hoveredIndex === index;
        const borderColor = item.color || "#ffffff";
        const textColor = item.color || "#ffffff";
        const bgColor = isHovered ? "#2a2a2a" : "#0a0a0a";
        
        return (
            <Panel
                key={"mat-" + index}
                style={{
                    width: "100%",
                    height: "50px",
                    backgroundColor: bgColor,
                    border: "2px solid " + borderColor,
                    marginBottom: "5px",
                    flowChildren: "right",
                    padding: "5px",
                }}
                onmouseover={() => handleMouseOver(index)}
                onmouseout={() => handleMouseOut()}
                onactivate={() => {
                    if (item.usable) {
                        useMaterial(item);
                    }
                }}
            >
                <Image
                    src={item.icon}
                    style={{
                        width: "40px",
                        height: "40px",
                        marginRight: "10px",
                    }}
                />
                <Label
                    text={item.name}
                    style={{
                        fontSize: "14px",
                        color: textColor,
                        fontWeight: "bold",
                        marginTop: "12px",
                    }}
                />
                <Panel style={{ width: "fill-parent-flow(1)", height: "1px" }} />
                <Label
                    text={"x" + item.count}
                    style={{
                        fontSize: "16px",
                        color: "#ffffff",
                        fontWeight: "bold",
                        marginTop: "12px",
                        marginRight: "5px",
                    }}
                />
                {item.usable ?  (
                    <Label
                        text="▶"
                        style={{
                            fontSize: "14px",
                            color: "#00ff00",
                            marginTop: "12px",
                        }}
                    />
                ) : null}
            </Panel>
        );
    };

    // 渲染分类
    const renderCategory = (category: string, catIndex: number) => {
        const items = groupedMaterials[category];
        if (!items || items.length === 0) return null;

        const categoryItems: React.ReactNode[] = [];
        
        for (let i = 0; i < items.length; i++) {
            categoryItems.push(renderMaterial(items[i], globalIndex));
            globalIndex++;
        }

        return (
            <Panel key={"cat-" + catIndex} style={{ width: "100%", flowChildren: "down", marginBottom: "10px" }}>
                <Label
                    text={getCategoryName(category)}
                    style={{
                        fontSize: "16px",
                        color: "#ffd700",
                        marginBottom: "5px",
                        fontWeight: "bold",
                    }}
                />
                {categoryItems}
            </Panel>
        );
    };

    // 渲染所有分类
    const renderCategories = () => {
        globalIndex = 0;
        const result: React.ReactNode[] = [];
        for (let i = 0; i < categories.length; i++) {
            result.push(renderCategory(categories[i], i));
        }
        return result;
    };

    // ⭐ 渲染悬停详情面板
    const renderHoverPanel = () => {
        if (! hoveredItem) return null;

        return (
            <Panel
                hittest={true}
                style={{
                    width: "200px",
                    backgroundColor: "#1a1a1aee",
                    border: "2px solid " + (hoveredItem.color || "#ffffff"),
                    padding: "12px",
                    flowChildren: "down",
                }}
                onmouseover={keepHoverPanel}
                onmouseout={handleMouseOut}
            >
                {/* 材料名称 */}
                <Label
                    text={hoveredItem.name}
                    style={{
                        fontSize: "18px",
                        color: hoveredItem.color || "#ffffff",
                        fontWeight: "bold",
                        marginBottom: "8px",
                    }}
                />
                
                {/* 分隔线 */}
                <Panel style={{
                    width: "100%",
                    height: "1px",
                    backgroundColor: "#555555",
                    marginBottom: "8px",
                }} />
                
                {/* 材料描述 */}
                <Label
                    text={hoveredItem.description || "暂无描述"}
                    style={{
                        fontSize: "13px",
                        color: "#cccccc",
                        marginBottom: "10px",
                    }}
                />
                
                {/* 数量 */}
                <Label
                    text={"数量: " + hoveredItem. count}
                    style={{
                        fontSize: "14px",
                        color: "#888888",
                        marginBottom: "5px",
                    }}
                />
                
                {/* 使用提示 */}
                {hoveredItem.usable ?  (
                    <Panel style={{
                        width: "100%",
                        backgroundColor: "#2a4a2a",
                        padding: "8px",
                        marginTop: "5px",
                    }}>
                        <Label
                            text={isUsing ? "⏳ 使用中..." : "💡 点击使用"}
                            style={{
                                fontSize: "14px",
                                color: isUsing ? "#ffff00" : "#00ff00",
                                textAlign: "center",
                            }}
                        />
                    </Panel>
                ) : null}
            </Panel>
        );
    };

    return (
        <Panel
            style={{
                flowChildren: "right",
            }}
        >
            {/* 材料背包主面板 */}
            <Panel
                style={{
                    width: "280px",
                    height: "520px",
                    backgroundColor: "#1c1410",
                    border: "4px solid #8b7355",
                    flowChildren: "down",
                }}
            >
                {/* 标题栏 */}
                <Panel
                    style={{
                        width: "100%",
                        height: "60px",
                        backgroundColor: "#2a1f1a",
                        borderBottom: "3px solid #8b7355",
                        flowChildren: "right",
                        padding: "10px 15px",
                    }}
                >
                    <Label
                        text="📦 材料背包"
                        style={{
                            fontSize: "24px",
                            color: "#ffd700",
                            fontWeight: "bold",
                        }}
                    />
                    <Panel style={{ width: "fill-parent-flow(1)", height: "1px" }} />
                    <Button
                        onactivate={onClose}
                        style={{
                            width: "36px",
                            height: "36px",
                            backgroundColor: "#8b0000",
                            border: "2px solid #ff0000",
                        }}
                    >
                        <Label text="✕" style={{ fontSize: "24px", color: "white", textAlign: "center" }} />
                    </Button>
                </Panel>

                {/* 材料列表 */}
                <Panel
                    style={{
                        width: "100%",
                        height: "460px",
                        padding: "10px",
                        flowChildren: "down",
                        overflow: "squish scroll",
                    }}
                >
                    {materials.length === 0 ? (
                        <Label
                            text="暂无材料"
                            style={{
                                fontSize: "18px",
                                color: "#888888",
                                textAlign: "center",
                                marginTop: "20px",
                            }}
                        />
                    ) : (
                        renderCategories()
                    )}
                </Panel>
            </Panel>

            {/* ⭐ 悬停详情面板 - 作为同级元素，显示在材料背包右侧 */}
            {renderHoverPanel()}
        </Panel>
    );
};