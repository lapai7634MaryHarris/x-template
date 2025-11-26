import { FC, useEffect, useState } from "react";
import React from "react";
import { ExternalRewardItem } from "./../../../../game/scripts/src/dungeon/external_reward_pool";


export const RewardSelection: FC<{ visible: boolean; onSelect: (reward: ExternalRewardItem ) => void }> = ({ visible, onSelect }) => {
    const [rewards, setRewards] = useState<ExternalRewardItem []>([]);

    // 监听奖励数据更新事件
    useEffect(() => {
        if (visible) {
            const listenerId = GameEvents.Subscribe("show_reward_selection", (event: any) => {
                setRewards(event.rewards || []);
            });

            return () => {
                GameEvents.Unsubscribe(listenerId);
            };
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Panel style={{
            width: "800px",
            height: "300px",
            backgroundColor: "#000000cc",
            border: "3px solid #ffd700",
            flowChildren: "right center",
            horizontalAlign: "center",
            verticalAlign: "center",
        }}>
            {rewards.map((reward, index) => (
                <Panel
                    key={index}
                    style={{
                        width: "220px",
                        height: "280px",
                        margin: "10px",
                        backgroundColor: "#1a1a1a",
                        border: "2px solid #ffffff",
                        flowChildren: "down center",
                    }}
                    onactivate={() => onSelect(reward)}
                >
                    <Image src={reward.icon} style={{ width: "200px", height: "200px" }} />
                    <Label text={reward.name} style={{ fontSize: "20px", color: "#ffd700", textAlign: "center" }} />
                    <Label text={`${reward.attribute}+${reward.value}`} style={{ fontSize: "16px", color: "#00ff00", textAlign: "center" }} />
                </Panel>
            ))}
        </Panel>
    );
};