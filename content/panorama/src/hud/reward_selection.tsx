import { FC, useEffect, useState } from "react";
import React from "react";
import { ExternalRewardItem } from "./../../../../game/scripts/src/dungeon/external_reward_pool";
const formatStats = (stats: any): string => {
    if (!stats) return "无属性";
    
    // 如果是对象，转换为数组
    const statsArray = Array.isArray(stats) ? stats : Object.values(stats);
    
    if (statsArray.length === 0) return "无属性";
    
    return statsArray
        .map((s: any) => `${s?. attribute || '未知'} +${s?.value || 0}`)
        .join(", ");
};
export const RewardSelection: FC<{ visible: boolean; onSelect: (reward: ExternalRewardItem) => void }> = ({ visible, onSelect }) => {
    const [rewards, setRewards] = useState<ExternalRewardItem[]>([]);
const formatStats = (stats: any): string => {
    if (!stats) return "无属性";
    
    try {
        const statsArray = Array.isArray(stats) ? stats : Object.values(stats);
        return statsArray
            . filter((s: any) => s && s.attribute)
            .map((s: any) => `${s.attribute} +${s.value}`)
            .join(", ") || "无属性";
    } catch (e) {
        console.log("[RewardSelection] 格式化 stats 出错:", e);
        return "无属性";
    }
};
    useEffect(() => {
        console.log("[RewardSelection] 组件挂载");
        
        const listenerId = GameEvents.Subscribe("show_reward_selection", (event: any) => {
            console.log("[RewardSelection] 收到事件", event);
            
            if (event && event.rewards) {
                // ⭐ 将对象转换为数组
                let rewardsArray: ExternalRewardItem[];
                
                if (Array.isArray(event.rewards)) {
                    rewardsArray = event.rewards;
                } else {
                    rewardsArray = Object.values(event.rewards);
                }
                
                console.log(`[RewardSelection] 设置 ${rewardsArray.length} 件奖励`);
                setRewards(rewardsArray);
            }
        });

        return () => {
            GameEvents.Unsubscribe(listenerId);
        };
    }, []);

    console.log(`[RewardSelection] visible=${visible}, rewards=${rewards.length}`);

    if (!visible || rewards.length === 0) {
        return null;
    }

    return (
        <Panel style={{
            width: "100%",
            height: "100%",
            horizontalAlign: "center",
            verticalAlign: "center",
            backgroundColor: "#000000dd",
            zIndex: 10001,
        }}>
            <Panel style={{
                width: "800px",
                height: "500px",
                backgroundColor: "#1a1a1aee",
                border: "3px solid #ffd700",
                flowChildren: "down",
                padding: "20px",
            }}>
                <Label 
                    text={`选择一件装备 (共${rewards.length}件)`}
                    style={{ 
                        fontSize: "32px", 
                        color: "#ffd700", 
                        textAlign: "center",
                        marginBottom: "20px"
                    }} 
                />
                
                <Panel style={{ flowChildren: "down" }}>
                    {rewards.map((reward, index) => (
                        <Panel
                            key={index}
                            style={{
                                height: "80px",
                                backgroundColor: "#2a2a2a",
                                border: "2px solid #ffaa00",
                                marginBottom: "10px",
                                padding: "15px",
                                flowChildren: "right",
                            }}
                            onactivate={() => {
                                console.log(`[RewardSelection] 选择: ${reward.name}`);
                                
                                // 发送到服务器
                                (GameEvents as any).SendCustomGameEventToServer("reward_selected", {
                                    PlayerID: Players.GetLocalPlayer(),
                                    reward: reward,
                                    rewardIndex: index
                                });
                                
                                // 调用回调
                                onSelect(reward);
                                
                                // 清空
                                setRewards([]);
                            }}
                            onmouseover={(panel) => {
                                panel.style.backgroundColor = "#3a3a3a";
                                panel.style.border = "3px solid #ffd700";
                            }}
                            onmouseout={(panel) => {
                                panel. style.backgroundColor = "#2a2a2a";
                                panel.style.border = "2px solid #ffaa00";
                            }}
                        >
                            <Label 
                                text={`${index + 1}. `}
                                style={{ 
                                    fontSize: "32px", 
                                    color: "#ffd700",
                                    width: "50px"
                                }}
                            />
                            <Panel style={{ flowChildren: "down" }}>
                                <Label 
                                    text={reward.name}
                                    style={{ 
                                        fontSize: "24px", 
                                        color: "#ffffff",
                                        fontWeight: "bold"
                                    }}
                                />
                             <Label 
    text={`${reward.type || '未知'} - ${formatStats(reward.stats)}`}
    style={{ 
        fontSize: "18px", 
        color: "#00ff00"
    }}
/>
                            </Panel>
                        </Panel>
                    ))}
                </Panel>
            </Panel>
        </Panel>
    );
};