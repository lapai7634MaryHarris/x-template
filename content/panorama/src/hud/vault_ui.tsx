import React, { useState, useEffect } from 'react';

interface ExternalRewardItem {
    name: string;
    type: string;
    icon: string;
    attribute: string;
    value: number;
}

interface VaultUIProps {
    visible: boolean;
    onClose: () => void;
}

export const VaultUI: React.FC<VaultUIProps> = ({ visible, onClose }) => {
    const [vaultItems, setVaultItems] = useState<ExternalRewardItem[]>([]);

    // 监听仓库数据更新
    useEffect(() => {
        if (! visible) return;

        $. Msg('[VaultUI] 界面打开，请求仓库数据');
        
        // 请求服务器发送仓库数据
          (GameEvents.SendCustomGameEventToServer as any)('request_vault_data', {
            PlayerID: Players.GetLocalPlayer()
        });

        // 监听服务器返回的仓库数据
        const listener = GameEvents.Subscribe('update_vault_ui', (data: any) => {
            $. Msg('[VaultUI] 收到仓库数据:', data);
            
            // 转换数据
            const items: ExternalRewardItem[] = [];
            if (data.items) {
                if (Array.isArray(data.items)) {
                    items.push(...data.items);
                } else if (typeof data.items === 'object') {
                    for (const key in data.items) {
                        items.push(data.items[key]);
                    }
                }
            }
            
            setVaultItems(items);
            $. Msg(`[VaultUI] 显示 ${items.length} 件装备`);
        });

        return () => {
            GameEvents.Unsubscribe(listener);
        };
    }, [visible]);

    // 装备物品
    const onEquipItem = (index: number) => {
        $. Msg(`[VaultUI] 装备索引 ${index} 的装备`);
        
      (GameEvents.SendCustomGameEventToServer as any)('equip_item_from_vault', {
            PlayerID: Players. GetLocalPlayer(),
            index: index
        });

        // 播放音效
        Game.EmitSound('ui. crafting_gem_create');
    };

    if (!visible) return null;

    return (
        <Panel className="VaultUI">
            {/* 背景遮罩 */}
            <Panel className="VaultUI__Background" onactivate={onClose} />

            {/* 主面板 */}
            <Panel className="VaultUI__Container">
                {/* 标题栏 */}
                <Panel className="VaultUI__Header">
                    <Label className="VaultUI__Title" text="装备仓库" />
                    <Label className="VaultUI__Count" text={`${vaultItems.length} 件装备`} />
                    <Button className="VaultUI__CloseButton" onactivate={onClose}>
                        <Label text="✕" />
                    </Button>
                </Panel>

                {/* 装备列表 */}
                <Panel className="VaultUI__Content">
                    {vaultItems.length === 0 ? (
                        <Panel className="VaultUI__Empty">
                            <Label className="VaultUI__EmptyTitle" text="仓库是空的" />
                            <Label className="VaultUI__EmptyHint" text="通关副本获取装备" />
                        </Panel>
                    ) : (
                        <Panel className="VaultUI__Grid">
                            {vaultItems.map((item, index) => (
                                <Panel key={index} className="VaultUI__Item">
                                    <Panel className="VaultUI__ItemCard">
                                        {/* 装备图标 */}
                                        <Image 
                                            className="VaultUI__ItemIcon" 
                                            src={item.icon} 
                                        />
                                        
                                        {/* 装备信息 */}
                                        <Panel className="VaultUI__ItemInfo">
                                            <Label 
                                                className="VaultUI__ItemName" 
                                                text={item.name} 
                                            />
                                            <Label 
                                                className="VaultUI__ItemType" 
                                                text={item.type} 
                                            />
                                            <Label 
                                                className="VaultUI__ItemAttribute" 
                                                text={`${item.attribute} +${item.value}`} 
                                            />
                                        </Panel>

                                        {/* 装备按钮 */}
                                        <Button 
                                            className="VaultUI__EquipButton"
                                            onactivate={() => onEquipItem(index)}
                                        >
                                            <Label text="装备" />
                                        </Button>
                                    </Panel>
                                </Panel>
                            ))}
                        </Panel>
                    )}
                </Panel>
            </Panel>
        </Panel>
    );
};