import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import { ExternalRewardItem } from "./../../../../game/scripts/src/dungeon/external_reward_pool";
import { VaultUI } from './vault_ui';

import '../utils/hide-default-hud';
import { RewardSelection } from "./reward_selection";
import { type FC, useState, useEffect } from 'react';
import { render } from 'react-panorama-x';
import { PanoramaQRCode } from '../utils/react-panorama-qrcode';
import { DispatchEventAction, FunctionAction, RunSequentialActions, WaitAction } from '../utils/sequential-actions';
import React from 'react';
import { RageBar } from './rage_bar/rage_bar';
import { setKeyDownCallback, useKeyPressed } from '../hooks/useKeyboard';
import { registerCustomKey } from '../utils/keybinding';
import { EquipmentUI } from './equipment_ui';
import { MaterialsUI } from './materials_ui';
import { ClassSelection } from './class_selection';
import { SkillTreeUI } from './skill_tree_ui';  // ⭐ 新增导入

registerCustomKey('D');
registerCustomKey('F');
registerCustomKey('B');
registerCustomKey('C');
registerCustomKey('K');  // ⭐ 注册技能树快捷键


// 副本菜单组件
const DungeonMenu: FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
    const [selectedDungeon, setSelectedDungeon] = useState<string | null>(null);

    const selectDungeon = (dungeonType: string) => {
        $. Msg(`[DungeonMenu] 点击了副本: ${dungeonType}`);
        
        if (dungeonType === "A") {
            $. Msg('[DungeonMenu] 设置状态为 A');
            setSelectedDungeon("A");
        } else {
            // @ts-ignore
            GameEvents.SendCustomGameEventToServer('select_dungeon', {
                PlayerID: Players.GetLocalPlayer(),
                dungeon_type: dungeonType,
                difficulty: "normal_1"
            });
            onClose();
        }
    };

    const selectDifficulty = (difficulty: string) => {
        $.Msg(`[DungeonMenu] 选择难度: ${difficulty}`);
        
        // @ts-ignore
        GameEvents.SendCustomGameEventToServer('select_dungeon', {
            PlayerID: Players.GetLocalPlayer(),
            dungeon_type: selectedDungeon,
            difficulty: difficulty
        });
        
        setSelectedDungeon(null);
        onClose();
    };

    const goBack = () => {
        $. Msg('[DungeonMenu] 返回');
        setSelectedDungeon(null);
    };

    if (!visible) return null;

    $. Msg(`[DungeonMenu] 渲染，selectedDungeon = ${selectedDungeon}`);

    // 难度选择界面
    if (selectedDungeon === "A") {
        $. Msg('[DungeonMenu] 渲染难度选择界面');
        
        return (
            <Panel style={{
                width: '100%',
                height: '100%',
                align: 'center center',
                zIndex: 10000,
                backgroundColor: '#000000dd',
            }}>
                <Panel style={{
                    width: '900px',
                    height: '650px',
                    backgroundColor: '#1a1a2edd',
                    border: '3px solid #ffd700',
                    padding: '20px',
                    flowChildren: 'down',
                }}>
                    <Label text="选择难度" style={{ 
                        fontSize: '42px', 
                        color: '#ffd700', 
                        textAlign: 'center', 
                        marginBottom: '20px' 
                    }} />
                    
                    {/* 简单难度 */}
                    <Label text="简单" style={{ 
                        fontSize: '32px', 
                        color: '#00ff00', 
                        marginBottom: '10px',
                        marginTop: '10px'
                    }} />
                    <Panel style={{ flowChildren: 'right', marginBottom: '15px', width: '100%' }}>
                        <Panel style={{ 
                            width: '280px', 
                            height: '70px', 
                            backgroundColor: '#00ff0088', 
                            border: '2px solid #00ff00',
                            marginRight: '10px', 
                            verticalAlign: 'center',
                            horizontalAlign: 'center'
                        }} onactivate={() => selectDifficulty('easy_1')}>
                            <Label text="1 星" style={{ 
                                fontSize: '32px', 
                                color: '#ffffff',
                                horizontalAlign: 'center',
                                verticalAlign: 'center'
                            }} />
                        </Panel>
                        <Panel style={{ 
                            width: '280px', 
                            height: '70px', 
                            backgroundColor: '#00ff00aa', 
                            border: '2px solid #00ff00',
                            marginRight: '10px',
                            verticalAlign: 'center',
                            horizontalAlign: 'center'
                        }} onactivate={() => selectDifficulty('easy_2')}>
                            <Label text="2 星" style={{ 
                                fontSize: '32px', 
                                color: '#ffffff',
                                horizontalAlign: 'center',
                                verticalAlign: 'center'
                            }} />
                        </Panel>
                        <Panel style={{ 
                            width: '280px', 
                            height: '70px', 
                            backgroundColor: '#00ff00cc', 
                            border: '2px solid #00ff00',
                            verticalAlign: 'center',
                            horizontalAlign: 'center'
                        }} onactivate={() => selectDifficulty('easy_3')}>
                            <Label text="3 星" style={{ 
                                fontSize: '32px', 
                                color: '#ffffff',
                                horizontalAlign: 'center',
                                verticalAlign: 'center'
                            }} />
                        </Panel>
                    </Panel>
                    
                    {/* 普通难度 */}
                    <Label text="普通" style={{ 
                        fontSize: '32px', 
                        color: '#ffaa00', 
                        marginBottom: '10px',
                        marginTop: '10px'
                    }} />
                    <Panel style={{ flowChildren: 'right', marginBottom: '15px', width: '100%' }}>
                        <Panel style={{ 
                            width: '280px', 
                            height: '70px', 
                            backgroundColor: '#ffaa0088', 
                            border: '2px solid #ffaa00',
                            marginRight: '10px',
                            verticalAlign: 'center',
                            horizontalAlign: 'center'
                        }} onactivate={() => selectDifficulty('normal_1')}>
                            <Label text="1 星" style={{ 
                                fontSize: '32px', 
                                color: '#ffffff',
                                horizontalAlign: 'center',
                                verticalAlign: 'center'
                            }} />
                        </Panel>
                        <Panel style={{ 
                            width: '280px', 
                            height: '70px', 
                            backgroundColor: '#ffaa00aa', 
                            border: '2px solid #ffaa00',
                            marginRight: '10px',
                            verticalAlign: 'center',
                            horizontalAlign: 'center'
                        }} onactivate={() => selectDifficulty('normal_2')}>
                            <Label text="2 星" style={{ 
                                fontSize: '32px', 
                                color: '#ffffff',
                                horizontalAlign: 'center',
                                verticalAlign: 'center'
                            }} />
                        </Panel>
                        <Panel style={{ 
                            width: '280px', 
                            height: '70px', 
                            backgroundColor: '#ffaa00cc', 
                            border: '2px solid #ffaa00',
                            verticalAlign: 'center',
                            horizontalAlign: 'center'
                        }} onactivate={() => selectDifficulty('normal_3')}>
                            <Label text="3 星" style={{ 
                                fontSize: '32px', 
                                color: '#ffffff',
                                horizontalAlign: 'center',
                                verticalAlign: 'center'
                            }} />
                        </Panel>
                    </Panel>
                    
                    {/* 困难难度 */}
                    <Label text="困难" style={{ 
                        fontSize: '32px', 
                        color: '#ff0000', 
                        marginBottom: '10px',
                        marginTop: '10px'
                    }} />
                    <Panel style={{ flowChildren: 'right', marginBottom: '15px', width: '100%' }}>
                        <Panel style={{ 
                            width: '280px', 
                            height: '70px', 
                            backgroundColor: '#ff000088', 
                            border: '2px solid #ff0000',
                            marginRight: '10px',
                            verticalAlign: 'center',
                            horizontalAlign: 'center'
                        }} onactivate={() => selectDifficulty('hard_1')}>
                            <Label text="1 星" style={{ 
                                fontSize: '32px', 
                                color: '#ffffff',
                                horizontalAlign: 'center',
                                verticalAlign: 'center'
                            }} />
                        </Panel>
                        <Panel style={{ 
                            width: '280px', 
                            height: '70px', 
                            backgroundColor: '#ff0000aa', 
                            border: '2px solid #ff0000',
                            marginRight: '10px',
                            verticalAlign: 'center',
                            horizontalAlign: 'center'
                        }} onactivate={() => selectDifficulty('hard_2')}>
                            <Label text="2 星" style={{ 
                                fontSize: '32px', 
                                color: '#ffffff',
                                horizontalAlign: 'center',
                                verticalAlign: 'center'
                            }} />
                        </Panel>
                        <Panel style={{ 
                            width: '280px', 
                            height: '70px', 
                            backgroundColor: '#ff0000cc', 
                            border: '2px solid #ff0000',
                            verticalAlign: 'center',
                            horizontalAlign: 'center'
                        }} onactivate={() => selectDifficulty('hard_3')}>
                            <Label text="3 星" style={{ 
                                fontSize: '32px', 
                                color: '#ffffff',
                                horizontalAlign: 'center',
                                verticalAlign: 'center'
                            }} />
                        </Panel>
                    </Panel>
                    
                    {/* 返回按钮 */}
                    <Panel style={{
                        width: '100%',
                        horizontalAlign: 'center',
                        marginTop: '20px'
                    }}>
                        <Panel style={{ 
                            width: '200px', 
                            height: '60px', 
                            backgroundColor: '#666666',
                            border: '2px solid #999999',
                            verticalAlign: 'center',
                            horizontalAlign: 'center'
                        }} onactivate={goBack}>
                            <Label text="返回" style={{ 
                                fontSize: '28px', 
                                color: '#ffffff',
                                horizontalAlign: 'center',
                                verticalAlign: 'center'
                            }} />
                        </Panel>
                    </Panel>
                </Panel>
            </Panel>
        );
    }

    // 副本选择界面
    $. Msg('[DungeonMenu] 渲染副本选择界面');
    
    return (
        <Panel style={{
            width: '100%',
            height: '100%',
            align: 'center center',
            zIndex: 10000,
            backgroundColor: '#000000dd',
        }}>
            <Panel style={{
                width: '600px',
                height: '400px',
                backgroundColor: '#1a1a2edd',
                border: '3px solid #ffd700',
                padding: '20px',
                flowChildren: 'down',
            }}>
                <Label text="选择副本" style={{ 
                    fontSize: '42px', 
                    color: '#ffd700', 
                    textAlign: 'center', 
                    marginBottom: '20px' 
                }} />
                
                {/* 副本A */}
                <Panel style={{
                    height: '100px',
                    backgroundColor: '#00ff00',
                    border: '3px solid #ffffff',
                    marginBottom: '15px',
                    padding: '15px',
                    flowChildren: 'down',
                }} onactivate={() => selectDungeon('A')}>
                    <Label text="副本 A" style={{ fontSize: '32px', color: '#000000' }} />
                    <Label text="点击选择难度" style={{ fontSize: '20px', color: '#000000' }} />
                </Panel>
                
                {/* 副本B */}
                <Panel style={{
                    height: '80px',
                    backgroundColor: '#666666',
                    marginBottom: '10px',
                    padding: '15px',
                }} onactivate={() => selectDungeon('B')}>
                    <Label text="副本 B (测试开放)" style={{ fontSize: '28px', color: '#ffffff' }} />
                </Panel>
                
                {/* 关闭按钮 */}
                <Panel style={{
                    width: '100%',
                    horizontalAlign: 'center',
                    marginTop: '20px'
                }}>
                    <Panel style={{ 
                        width: '150px', 
                        height: '50px', 
                        backgroundColor: '#ff0000',
                        verticalAlign: 'center',
                        horizontalAlign: 'center'
                    }} onactivate={onClose}>
                        <Label text="关闭" style={{ 
                            fontSize: '24px', 
                            color: '#ffffff',
                            horizontalAlign: 'center',
                            verticalAlign: 'center'
                        }} />
                    </Panel>
                </Panel>
            </Panel>
        </Panel>
    );
};



const Root: FC = () => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [rewardVisible, setRewardVisible] = useState(false);
    const [vaultVisible, setVaultVisible] = useState(false);
    const [equipmentVisible, setEquipmentVisible] = useState(false);
    const [materialsVisible, setMaterialsVisible] = useState(false);
    const [skillTreeVisible, setSkillTreeVisible] = useState(false);  // ⭐ 新增：技能树状态
    
    // 职业选择状态
    const [showClassSelection, setShowClassSelection] = useState(true);
    const [classSelected, setClassSelected] = useState(false);

    const onSelectReward = (reward: ExternalRewardItem) => {
        $. Msg(`[Root] Selected reward: ${reward.name}`);
        setRewardVisible(false);
    };

    // 职业选择完成回调
    const onClassSelected = (classId: string) => {
        $. Msg('[Root] 职业选择完成: ' + classId);
        setClassSelected(true);
        setShowClassSelection(false);
    };

    const url = `https://github.com/XavierCHN/x-template`;
    const go = React.useCallback(() => {
        const wait = new WaitAction(0.5);
        const showTextTooltip = new DispatchEventAction(`DOTAShowTextTooltip`, $(`#QRCode`), `正在打开链接`);
        const hideTextTooltip = new DispatchEventAction(`DOTAHideTextTooltip`, $(`#QRCode`));
        const playSound = new FunctionAction(() => PlayUISoundScript('DotaSOS. TestBeep'));
        const gotoUrl = new DispatchEventAction(`ExternalBrowserGoToURL`, url);
        RunSequentialActions([showTextTooltip, wait, hideTextTooltip, wait, playSound, gotoUrl]);
    }, [url]);
    
    const dPressed = useKeyPressed(`D`);
    const bPressed = useKeyPressed(`B`);
    const cPressed = useKeyPressed(`C`);
    const kPressed = useKeyPressed(`K`);  // ⭐ 新增：K 键

    // B 键打开仓库
    useEffect(() => {
        if (bPressed && classSelected) {
            $. Msg('[Root] B 键按下，打开仓库');
            setVaultVisible(true);
            setMaterialsVisible(true);
        }
    }, [bPressed, classSelected]);

    // C 键打开装备界面
    useEffect(() => {
        if (cPressed && classSelected) {
            $.Msg('[Root] C 键按下，打开装备界面');
            setEquipmentVisible(true);
        }
    }, [cPressed, classSelected]);

    // ⭐ K 键打开技能树
    useEffect(() => {
        if (kPressed && classSelected) {
            $.Msg('[Root] K 键按下，切换技能树界面');
            setSkillTreeVisible(prev => !prev);
        }
    }, [kPressed, classSelected]);

    // 事件监听
    useEffect(() => {
        $. Msg('[Root] 注册事件监听器');
        
        const listenerMenu = GameEvents.Subscribe('show_dungeon_menu', () => {
            $. Msg('[Root] 收到 show_dungeon_menu 事件');
            setMenuVisible(true);
        });

        const listenerReward = GameEvents.Subscribe("show_reward_selection", () => {
            $. Msg('[Root] 收到 show_reward_selection 事件');
            setRewardVisible(true);
        });
        
        const listenerVault = GameEvents.Subscribe('show_vault_ui', () => {
            $. Msg('[Root] 收到 show_vault_ui 事件');
            setVaultVisible(true);
        });

        const listenerEquipment = GameEvents.Subscribe('show_equipment_ui', () => {
            $.Msg('[Root] 收到 show_equipment_ui 事件');
            setEquipmentVisible(true);
        });

        // ⭐ 新增：监听技能树显示事件
        const listenerSkillTree = GameEvents.Subscribe('show_skill_tree', () => {
            $.Msg('[Root] 收到 show_skill_tree 事件');
            setSkillTreeVisible(true);
        });

        // 监听职业选择确认事件
        const listenerClassConfirmed = GameEvents.Subscribe('class_selection_confirmed', (data: any) => {
            $.Msg(`[Root] 收到职业选择确认: ${data.classId}`);
            setClassSelected(true);
            setShowClassSelection(false);
        });

        return () => {
            GameEvents.Unsubscribe(listenerMenu);
            GameEvents.Unsubscribe(listenerReward);
            GameEvents.Unsubscribe(listenerVault);
            GameEvents.Unsubscribe(listenerEquipment);
            GameEvents.Unsubscribe(listenerSkillTree);
            GameEvents.Unsubscribe(listenerClassConfirmed);
        };
    }, []);

    return (
    <>
        {/* 职业选择界面 - 最高优先级 */}
        <ClassSelection 
            visible={showClassSelection} 
            onSelect={onClassSelected} 
        />

        {/* 以下内容只在选择职业后显示 */}
        {classSelected && (
            <>
                <RageBar />

                {/* 副本菜单弹窗 */}
                <DungeonMenu visible={menuVisible} onClose={() => {
                    $. Msg('[Root] 关闭副本菜单');
                    setMenuVisible(false);
                }} />

                {/* 奖励选择弹窗 */}
                <RewardSelection visible={rewardVisible} onSelect={onSelectReward} />
                
                {/* 仓库容器 */}
                {(vaultVisible || materialsVisible) && (
                    <Panel
                        style={{
                            width: '100%',
                            height: '100%',
                            zIndex: 100,
                            backgroundColor: '#000000cc',
                        }}
                    >
                        {/* 装备仓库弹窗 */}
                        {vaultVisible && (
                            <Panel
                                style={{
                                    horizontalAlign: 'center',
                                    verticalAlign: 'center',
                                }}
                            >
                                <VaultUI 
                                    visible={vaultVisible} 
                                    onClose={() => setVaultVisible(false)} 
                                />
                            </Panel>
                        )}
                        
                        {/* 材料仓库弹窗 */}
                        {materialsVisible && (
                            <MaterialsUI 
                                visible={materialsVisible} 
                                onClose={() => setMaterialsVisible(false)} 
                            />
                        )}
                    </Panel>
                )}
                
                {/* 装备界面弹窗 */}
                <EquipmentUI visible={equipmentVisible} onClose={() => setEquipmentVisible(false)} />
                
                {/* ⭐ 技能树界面 */}
                <SkillTreeUI 
                    visible={skillTreeVisible} 
                    onClose={() => setSkillTreeVisible(false)} 
                />
                
                {/* 右下角按钮区 */}
                <Panel style={{
                    width: '140px',
                    height: '520px',  // ⭐ 增加高度容纳新按钮
                    horizontalAlign: 'right',
                    verticalAlign: 'bottom',
                    marginRight: '20px',
                    marginBottom: '20px',
                    flowChildren: 'down',
                }}>
                    {/* ⭐ 技能树按钮 */}
                    <Button
                        onactivate={() => {
                            $.Msg('[Root] 点击技能树按钮');
                            Game.EmitSound('ui. button_click');
                            setSkillTreeVisible(true);
                        }}
                        style={{
                            width: '120px',
                            height: '120px',
                            backgroundColor: '#1a5a1a',
                            border: '3px solid #00aa00',
                            marginBottom: '20px',
                        }}
                        onmouseover={(panel) => {
                            panel. style.backgroundColor = '#226622';
                            panel.style.border = '4px solid #00cc00';
                            Game.EmitSound('ui.button_over');
                        }}
                        onmouseout={(panel) => {
                            panel.style. backgroundColor = '#1a5a1a';
                            panel.style.border = '3px solid #00aa00';
                        }}
                    >
                        <Panel style={{
                            width: '100%',
                            height: '100%',
                            flowChildren: 'down',
                        }}>
                            <Label 
                                text="📖"
                                style={{
                                    fontSize: '50px',
                                    textAlign: 'center',
                                    horizontalAlign: 'center',
                                    marginTop: '15px',
                                }}
                            />
                            <Label 
                                text="技能"
                                style={{
                                    fontSize: '22px',
                                    color: '#00ff00',
                                    textAlign: 'center',
                                    horizontalAlign: 'center',
                                    fontWeight: 'bold',
                                    marginTop: '5px',
                                }}
                            />
                            <Label 
                                text="(K)"
                                style={{
                                    fontSize: '16px',
                                    color: '#cccccc',
                                    textAlign: 'center',
                                    horizontalAlign: 'center',
                                }}
                            />
                        </Panel>
                    </Button>

                    {/* 装备按钮 */}
                    <Button
                        onactivate={() => {
                            $.Msg('[Root] 点击装备按钮');
                            Game.EmitSound('ui.button_click');
                            setEquipmentVisible(true);
                        }}
                        style={{
                            width: '120px',
                            height: '120px',
                            backgroundColor: '#4a148c',
                            border: '3px solid #9c27b0',
                            marginBottom: '20px',
                        }}
                        onmouseover={(panel) => {
                            panel.style.backgroundColor = '#6a1b9a';
                            panel.style.border = '4px solid #ba68c8';
                            Game. EmitSound('ui.button_over');
                        }}
                        onmouseout={(panel) => {
                            panel.style.backgroundColor = '#4a148c';
                            panel.style. border = '3px solid #9c27b0';
                        }}
                    >
                        <Panel style={{
                            width: '100%',
                            height: '100%',
                            flowChildren: 'down',
                        }}>
                            <Label 
                                text="⚔️"
                                style={{
                                    fontSize: '50px',
                                    textAlign: 'center',
                                    horizontalAlign: 'center',
                                    marginTop: '15px',
                                }}
                            />
                            <Label 
                                text="装备"
                                style={{
                                    fontSize: '22px',
                                    color: '#ba68c8',
                                    textAlign: 'center',
                                    horizontalAlign: 'center',
                                    fontWeight: 'bold',
                                    marginTop: '5px',
                                }}
                            />
                            <Label 
                                text="(C)"
                                style={{
                                    fontSize: '16px',
                                    color: '#cccccc',
                                    textAlign: 'center',
                                    horizontalAlign: 'center',
                                }}
                            />
                        </Panel>
                    </Button>

                    {/* 仓库按钮 */}
                    <Button
                        onactivate={() => {
                            $.Msg('[Root] 点击仓库按钮');
                            Game.EmitSound('ui.button_click');
                            setVaultVisible(true);
                            setMaterialsVisible(true);
                        }}
                        style={{
                            width: '120px',
                            height: '120px',
                            backgroundColor: '#8b4513',
                            border: '3px solid #ffd700',
                        }}
                        onmouseover={(panel) => {
                            panel.style.backgroundColor = '#a0522d';
                            panel.style.border = '4px solid #ffd700';
                            Game. EmitSound('ui.button_over');
                        }}
                        onmouseout={(panel) => {
                            panel.style.backgroundColor = '#8b4513';
                            panel.style. border = '3px solid #ffd700';
                        }}
                    >
                        <Panel style={{
                            width: '100%',
                            height: '100%',
                            flowChildren: 'down',
                        }}>
                            <Label 
                                text="🎒"
                                style={{
                                    fontSize: '50px',
                                    textAlign: 'center',
                                    horizontalAlign: 'center',
                                    marginTop: '15px',
                                }}
                            />
                            <Label 
                                text="仓库"
                                style={{
                                    fontSize: '22px',
                                    color: '#ffd700',
                                    textAlign: 'center',
                                    horizontalAlign: 'center',
                                    fontWeight: 'bold',
                                    marginTop: '5px',
                                }}
                            />
                            <Label 
                                text="(B)"
                                style={{
                                    fontSize: '16px',
                                    color: '#cccccc',
                                    textAlign: 'center',
                                    horizontalAlign: 'center',
                                }}
                            />
                        </Panel>
                    </Button>
                </Panel>

                {/* QRCODE 功能元素 */}
                <PanoramaQRCode
                    style={{ preTransformScale2d: dPressed ? `1.5` : `1` }}
                    id="QRCode"
                    onactivate={go}
                    value={url}
                    size={128}
                    excavate={8}
                    className={`QRCode`}
                >
                    <Image
                        src="file://{images}/logos/dota_logo_bright.psd"
                        style={{ width: `32px`, height: `32px`, horizontalAlign: `center`, verticalAlign: `center` }}
                    />
                </PanoramaQRCode>
            </>
        )}
    </>
    );
}

$. Msg('[HUD] 开始渲染 Root 组件');
render(<Root />, $. GetContextPanel());
$.Msg('[HUD] Root 组件渲染完成');