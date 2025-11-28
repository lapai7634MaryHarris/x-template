import React, { useState } from 'react';

interface ClassSelectionProps {
    visible: boolean;
    onSelect: (classId: string) => void;
}

export const ClassSelection: React. FC<ClassSelectionProps> = ({ visible, onSelect }) => {
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    if (!visible) return null;

    const handleSelectWarrior = () => {
        Game.EmitSound('ui. button_click');
        setSelectedClass('warrior');
    };

    const handleSelectLocked = () => {
        Game.EmitSound('General.Cancel');
    };

    const handleConfirm = () => {
        if (! selectedClass || isConfirming) return;
        
        setIsConfirming(true);
        Game.EmitSound('ui.crafting_gem_create');
        
        (GameEvents.SendCustomGameEventToServer as any)('select_class', {
            PlayerID: Players.GetLocalPlayer(),
            classId: selectedClass,
        });

        onSelect(selectedClass);
    };

    const isWarriorSelected = selectedClass === 'warrior';

    return (
        <Panel
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#0a0a0a',
                zIndex: 9999,
            }}
        >
            {/* 主容器 - 垂直居中 */}
            <Panel
                style={{
                    width: '100%',
                    height: '100%',
                    horizontalAlign: 'center',
                    verticalAlign: 'center',
                    flowChildren: 'down',
                }}
            >
                {/* 标题 */}
                <Label
                    text="选择你的职业"
                    style={{
                        fontSize: '48px',
                        color: '#ffd700',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                    }}
                />
                
                <Label
                    text="每个职业拥有独特的技能和战斗风格"
                    style={{
                        fontSize: '18px',
                        color: '#888888',
                        marginBottom: '40px',
                    }}
                />

                {/* 职业卡片容器 */}
                <Panel
                    style={{
                        flowChildren: 'right',
                        marginBottom: '40px',
                    }}
                >
                    {/* 战士卡片 */}
                    <Panel
                        style={{
                            width: '300px',
                            height: '400px',
                            backgroundColor: isWarriorSelected ?  '#1a3a1a' : '#1c1410',
                            border: isWarriorSelected ?  '4px solid #00ff00' : '3px solid #8b7355',
                            marginRight: '40px',
                            flowChildren: 'down',
                            padding: '20px',
                        }}
                        onactivate={handleSelectWarrior}
                    >
                        {/* 图标 */}
                        <Label
                            text="⚔️"
                            style={{
                                fontSize: '72px',
                                horizontalAlign: 'center',
                                marginBottom: '15px',
                            }}
                        />
                        
                        {/* 名称 */}
                        <Label
                            text="战士"
                            style={{
                                fontSize: '32px',
                                color: '#ffd700',
                                fontWeight: 'bold',
                                horizontalAlign: 'center',
                                marginBottom: '10px',
                            }}
                        />
                        
                        {/* 描述 */}
                        <Label
                            text="近战物理输出"
                            style={{
                                fontSize: '16px',
                                color: '#cccccc',
                                horizontalAlign: 'center',
                                marginBottom: '5px',
                            }}
                        />
                        <Label
                            text="擅长高爆发和AOE伤害"
                            style={{
                                fontSize: '14px',
                                color: '#aaaaaa',
                                horizontalAlign: 'center',
                                marginBottom: '20px',
                            }}
                        />
                        
                        {/* 分隔线 */}
                        <Panel
                            style={{
                                width: '80%',
                                height: '1px',
                                backgroundColor: '#8b7355',
                                horizontalAlign: 'center',
                                marginBottom: '15px',
                            }}
                        />
                        
                        {/* 资源 */}
                        <Label
                            text="资源：怒气"
                            style={{
                                fontSize: '14px',
                                color: '#ffaa00',
                                marginBottom: '5px',
                            }}
                        />
                        
                        {/* 被动 */}
                        <Label
                            text="先天被动：重伤"
                            style={{
                                fontSize: '14px',
                                color: '#00ff00',
                                marginBottom: '15px',
                            }}
                        />
                        
                        {/* 特色 */}
                        <Label text="• 高爆发伤害" style={{ fontSize: '13px', color: '#aaaaaa', marginBottom: '3px' }} />
                        <Label text="• AOE技能" style={{ fontSize: '13px', color: '#aaaaaa', marginBottom: '3px' }} />
                        <Label text="• 强大生存能力" style={{ fontSize: '13px', color: '#aaaaaa' }} />
                        
                        {/* 选中标记 */}
                        {isWarriorSelected && (
                            <Panel
                                style={{
                                    width: '100%',
                                    height: '40px',
                                    backgroundColor: '#00aa00',
                                    marginTop: 'auto',
                                    horizontalAlign: 'center',
                                }}
                            >
                                <Label
                                    text="✓ 已选择"
                                    style={{
                                        fontSize: '18px',
                                        color: '#ffffff',
                                        fontWeight: 'bold',
                                        horizontalAlign: 'center',
                                        marginTop: '8px',
                                    }}
                                />
                            </Panel>
                        )}
                    </Panel>

                    {/* 锁定职业卡片 */}
                    <Panel
                        style={{
                            width: '300px',
                            height: '400px',
                            backgroundColor: '#1a1a1a',
                            border: '3px solid #444444',
                            flowChildren: 'down',
                            padding: '20px',
                            opacity: '0.6',
                        }}
                        onactivate={handleSelectLocked}
                    >
                        {/* 图标 */}
                        <Label
                            text="🔒"
                            style={{
                                fontSize: '72px',
                                horizontalAlign: 'center',
                                marginBottom: '15px',
                            }}
                        />
                        
                        {/* 名称 */}
                        <Label
                            text="?? ?"
                            style={{
                                fontSize: '32px',
                                color: '#666666',
                                fontWeight: 'bold',
                                horizontalAlign: 'center',
                                marginBottom: '5px',
                            }}
                        />
                        
                        {/* 锁定原因 */}
                        <Label
                            text="(尚未开发)"
                            style={{
                                fontSize: '16px',
                                color: '#ff6666',
                                horizontalAlign: 'center',
                                marginBottom: '20px',
                            }}
                        />
                        
                        {/* 描述 */}
                        <Label
                            text="神秘职业"
                            style={{
                                fontSize: '16px',
                                color: '#555555',
                                horizontalAlign: 'center',
                                marginBottom: '5px',
                            }}
                        />
                        <Label
                            text="敬请期待"
                            style={{
                                fontSize: '14px',
                                color: '#444444',
                                horizontalAlign: 'center',
                            }}
                        />
                    </Panel>
                </Panel>

                {/* 底部信息框 */}
                <Panel
                    style={{
                        width: '600px',
                        height: '80px',
                        backgroundColor: '#151515',
                        border: '2px solid #8b7355',
                        marginBottom: '30px',
                        horizontalAlign: 'center',
                        verticalAlign: 'center',
                    }}
                >
                    <Label
                        text={isWarriorSelected ? '已选择：战士 - 近战物理输出职业' : '请选择一个职业开始游戏'}
                        style={{
                            fontSize: '20px',
                            color: isWarriorSelected ?  '#ffd700' : '#888888',
                            horizontalAlign: 'center',
                            verticalAlign: 'center',
                        }}
                    />
                </Panel>

                {/* 确认按钮 */}
                <Panel
                    style={{
                        width: '300px',
                        height: '60px',
                        backgroundColor: selectedClass ?  (isConfirming ? '#666666' : '#2d7d2d') : '#333333',
                        border: selectedClass ?  '3px solid #4caf50' : '2px solid #555555',
                        horizontalAlign: 'center',
                        verticalAlign: 'center',
                    }}
                    onactivate={handleConfirm}
                >
                    <Label
                        text={isConfirming ? '正在进入游戏.. .' : (selectedClass ? '确认选择' : '请先选择职业')}
                        style={{
                            fontSize: '24px',
                            color: selectedClass ?  '#ffffff' : '#666666',
                            fontWeight: 'bold',
                            horizontalAlign: 'center',
                            verticalAlign: 'center',
                        }}
                    />
                </Panel>
            </Panel>
        </Panel>
    );
};