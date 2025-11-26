import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import { ExternalRewardItem } from "./../../../../game/scripts/src/dungeon/external_reward_pool";

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

registerCustomKey('D');
registerCustomKey('F');



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
        $. Msg(`[DungeonMenu] 选择难度: ${difficulty}`);
        
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

    if (! visible) return null;

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
                    <Label text="副本 B (开发中)" style={{ fontSize: '28px', color: '#ffffff' }} />
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
    const [menuVisible, setMenuVisible] = useState(false);            // 副本菜单显示状态
    const [rewardVisible, setRewardVisible] = useState(false);        // 奖励选择显示状态

    // 奖励选择回调
    const onSelectReward = (reward: ExternalRewardItem) => {
        $.Msg(`[Root] Selected reward: ${reward.name}`);

        GameEvents.SendCustomGameEventToServer("reward_selected", {
            PlayerID: Players.GetLocalPlayer(),
            reward: reward
        });

        setRewardVisible(false); // 关闭奖励界面
    };

    // QRCODE相关
    const url = `https://github.com/XavierCHN/x-template`;
    const go = React.useCallback(() => {
        const wait = new WaitAction(0.5);
        const showTextTooltip = new DispatchEventAction(`DOTAShowTextTooltip`, $(`#QRCode`), `正在打开链接`);
        const hideTextTooltip = new DispatchEventAction(`DOTAHideTextTooltip`, $(`#QRCode`));
        const playSound = new FunctionAction(() => PlayUISoundScript('DotaSOS.TestBeep'));
        const gotoUrl = new DispatchEventAction(`ExternalBrowserGoToURL`, url);
        RunSequentialActions([showTextTooltip, wait, hideTextTooltip, wait, playSound, gotoUrl]);
    }, [url]);
    const dPressed = useKeyPressed(`D`);

    // 事件监听
    useEffect(() => {
        $.Msg('[Root] 注册事件监听器');
        
        // 副本菜单弹出
        const listenerMenu = GameEvents.Subscribe('show_dungeon_menu', () => {
            $.Msg('[Root] 收到 show_dungeon_menu 事件');
            setMenuVisible(true);
        });

        // 奖励选择弹出
        const listenerReward = GameEvents.Subscribe("show_reward_selection", () => {
            $.Msg('[Root] 收到 show_reward_selection 事件');
            setRewardVisible(true);
        });

        return () => {
            GameEvents.Unsubscribe(listenerMenu);
            GameEvents.Unsubscribe(listenerReward);
        };
    }, []);

    $.Msg(`[Root] 渲染，menuVisible = ${menuVisible}, rewardVisible = ${rewardVisible}`);

    return (
        <>
            <RageBar />

            {/* 副本菜单弹窗 */}
            <DungeonMenu visible={menuVisible} onClose={() => {
                $.Msg('[Root] 关闭副本菜单');
                setMenuVisible(false);
            }} />

            {/* 奖励选择弹窗 */}
            <RewardSelection visible={rewardVisible} onSelect={onSelectReward} />

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
    );
};

$.Msg('[HUD] 开始渲染 Root 组件');
render(<Root />, $.GetContextPanel());
$.Msg('[HUD] Root 组件渲染完成');