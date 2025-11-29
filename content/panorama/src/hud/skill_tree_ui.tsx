import React, { useState, useEffect } from 'react';

interface SkillDef {
    id: string;
    name: string;
    desc: string;
    icon: string;
    type: string;
    maxLv: number;
    reqLv: number;
    done: boolean;
}

const SKILLS: SkillDef[] = [
    { id: 'warrior_deep_wound', name: '重伤', desc: '暴击时施加流血', icon: 'bloodseeker_rupture', type: 'passive', maxLv: 1, reqLv: 1, done: true },
    { id: 'warrior_thunder_strike', name: '雷霆一击', desc: '对周围造成AOE伤害', icon: 'sven_storm_bolt', type: 'active', maxLv: 5, reqLv: 1, done: true },
    { id: 'warrior_sudden_death', name: '猝死', desc: '攻击有几率触发猝死', icon: 'skeleton_king_reincarnation', type: 'passive', maxLv: 5, reqLv: 5, done: true },
    { id: 'warrior_execute', name: '斩杀', desc: '对低血量目标致命伤害', icon: 'axe_culling_blade', type: 'ultimate', maxLv: 1, reqLv: 10, done: true },
    { id: 'warrior_strike', name: '猛击', desc: '造成150%武器伤害', icon: 'sven_great_cleave', type: 'active', maxLv: 5, reqLv: 1, done: false },
    { id: 'warrior_whirlwind', name: '旋风斩', desc: '对周围敌人AOE伤害', icon: 'juggernaut_blade_fury', type: 'active', maxLv: 5, reqLv: 5, done: false },
    { id: 'warrior_warcry', name: '战吼', desc: '提升攻击力', icon: 'sven_warcry', type: 'active', maxLv: 5, reqLv: 3, done: false },
    { id: 'warrior_berserker', name: '狂战士', desc: '血量越低攻击越高', icon: 'huskar_berserkers_blood', type: 'passive', maxLv: 5, reqLv: 8, done: false },
    { id: 'warrior_bloodthirst', name: '嗜血', desc: '击杀回复生命', icon: 'bloodseeker_thirst', type: 'passive', maxLv: 5, reqLv: 5, done: false },
    { id: 'warrior_armor_break', name: '破甲', desc: '降低目标护甲', icon: 'slardar_amplify_damage', type: 'active', maxLv: 5, reqLv: 6, done: false },
    { id: 'warrior_charge', name: '冲锋', desc: '冲向目标并眩晕', icon: 'spirit_breaker_charge_of_darkness', type: 'active', maxLv: 5, reqLv: 4, done: false },
    { id: 'warrior_block', name: '格挡', desc: '格挡物理伤害', icon: 'tidehunter_kraken_shell', type: 'passive', maxLv: 5, reqLv: 3, done: false },
    { id: 'warrior_tenacity', name: '坚韧', desc: '增加生命值', icon: 'huskar_inner_fire', type: 'passive', maxLv: 5, reqLv: 2, done: false },
    { id: 'warrior_critical', name: '致命打击', desc: '增加暴击', icon: 'phantom_assassin_coup_de_grace', type: 'passive', maxLv: 5, reqLv: 7, done: false },
    { id: 'warrior_avatar', name: '战神降临', desc: '大幅提升属性', icon: 'sven_gods_strength', type: 'ultimate', maxLv: 3, reqLv: 15, done: false },
];

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const SkillTreeUI: React.FC<Props> = ({ visible, onClose }) => {
    const [points, setPoints] = useState(0);
    const [levels, setLevels] = useState<Record<string, number>>({});
    const [heroLv, setHeroLv] = useState(1);
    const [selIdx, setSelIdx] = useState(-1);

    useEffect(() => {
        if (! visible) return;

        GameEvents.SendCustomGameEventToServer('skill_point_request_data' as never, {} as never);

        const listener = GameEvents.Subscribe('skill_point_data_update' as never, (d: any) => {
            setPoints(d.availablePoints || 0);
            setLevels(d.skillLevels || {});
            setHeroLv(d. playerLevel || 1);
        });

        return () => { GameEvents.Unsubscribe(listener); };
    }, [visible]);

    if (!visible) return null;

    const getLv = (id: string) => levels[id] || 0;

    const canUp = (s: SkillDef) => {
        if (! s.done || points <= 0) return false;
        if (getLv(s.id) >= s.maxLv) return false;
        if (heroLv < s.reqLv) return false;
        return true;
    };

    const doUpgrade = () => {
        if (selIdx < 0) return;
        const s = SKILLS[selIdx];
        if (!canUp(s)) return;
        GameEvents.SendCustomGameEventToServer('skill_point_upgrade_skill' as never, { skillId: s.id } as never);
    };

    const doReset = () => {
        GameEvents.SendCustomGameEventToServer('skill_point_reset' as never, {} as never);
    };

    const sel = selIdx >= 0 ? SKILLS[selIdx] : null;

    // 分成3行，每行5个
    const row1 = SKILLS.slice(0, 5);
    const row2 = SKILLS.slice(5, 10);
    const row3 = SKILLS.slice(10, 15);

    const renderSkill = (s: SkillDef, idx: number) => {
        const lv = getLv(s.id);
        const isSel = selIdx === idx;
        const border = ! s.done ?  '#222' : isSel ? '#ffaa00' : lv >= s.maxLv ?  '#00cc00' : lv > 0 ? '#008800' : canUp(s) ? '#886600' : '#333';
        const bg = ! s.done ? '#080808' : isSel ? '#1a1500' : lv >= s.maxLv ? '#0a200a' : lv > 0 ? '#0a150a' : '#0c0c0c';

        return (
            <Panel
                key={s.id}
                hittest={true}
                style={{
                    width: '110px',
                    height: '125px',
                    margin: '3px',
                    backgroundColor: bg,
                    border: '2px solid ' + border,
                    flowChildren: 'down',
                }}
                onactivate={() => { setSelIdx(idx); }}
            >
                <Panel style={{ width: '100%', height: '3px', backgroundColor: s.done ? (s.type === 'active' ?  '#4488ff' : s.type === 'passive' ? '#44cc44' : '#ff8800') : '#333' }} />
                <Panel style={{ width: '60px', height: '60px', marginTop: '6px', marginLeft: '22px', border: '1px solid #333' }}>
                    <DOTAAbilityImage abilityname={s.icon} style={{ width: '100%', height: '100%', opacity: s.done ? '1' : '0.3' }} />
                </Panel>
                <Label text={s.name} style={{ fontSize: '11px', color: s.done ? '#ccc' : '#555', horizontalAlign: 'center', marginTop: '4px' }} />
                <Label text={lv + '/' + s.maxLv} style={{ fontSize: '10px', color: lv >= s.maxLv ?  '#0f0' : lv > 0 ? '#8f8' : '#666', horizontalAlign: 'center' }} />
                <Label text={! s.done ? '开发中' : lv >= s.maxLv ? '满级' : canUp(s) ? '可升级' : 'Lv' + s.reqLv} style={{ fontSize: '9px', color: ! s.done ? '#f60' : lv >= s.maxLv ? '#0f0' : canUp(s) ? '#fc0' : '#666', horizontalAlign: 'center' }} />
            </Panel>
        );
    };

    return (
        <Panel style={{ width: '100%', height: '100%', backgroundColor: '#000000cc' }}>
            <Panel style={{ width: '950px', height: '620px', backgroundColor: '#111', border: '3px solid #8b6914', flowChildren: 'down', horizontalAlign: 'center', verticalAlign: 'center' }}>
                
                {/* 标题 */}
                <Panel style={{ width: '100%', height: '50px', backgroundColor: '#1a1a15', borderBottom: '2px solid #8b6914', flowChildren: 'right' }}>
                    <Label text="◆ 技能天赋树 ◆" style={{ fontSize: '22px', color: '#ffd700', marginLeft: '20px', marginTop: '10px' }} />
                    <Panel style={{ width: '450px' }} />
                    <Label text={'技能点: ' + points} style={{ fontSize: '18px', color: points > 0 ? '#0f0' : '#888', marginTop: '12px' }} />
                    <Label text={'  等级: ' + heroLv} style={{ fontSize: '16px', color: '#88f', marginTop: '13px', marginLeft: '15px' }} />
                </Panel>

                {/* 内容 */}
                <Panel style={{ width: '100%', height: '505px', flowChildren: 'right' }}>
                    
                    {/* 技能区 */}
                    <Panel style={{ width: '600px', height: '100%', backgroundColor: '#0a0a0a', padding: '8px', flowChildren: 'down' }}>
                        <Panel style={{ flowChildren: 'right' }}>{row1. map((s, i) => renderSkill(s, i))}</Panel>
                        <Panel style={{ flowChildren: 'right' }}>{row2. map((s, i) => renderSkill(s, i + 5))}</Panel>
                        <Panel style={{ flowChildren: 'right' }}>{row3.map((s, i) => renderSkill(s, i + 10))}</Panel>
                    </Panel>

                    {/* 详情区 */}
                    <Panel style={{ width: '350px', height: '100%', backgroundColor: '#0c0c08', borderLeft: '2px solid #3a3020', padding: '12px', flowChildren: 'down' }}>
                        {sel ?  (
                            <>
                                <Panel style={{ flowChildren: 'right', marginBottom: '12px' }}>
                                    <Panel style={{ width: '64px', height: '64px', border: '2px solid ' + (sel.type === 'active' ? '#48f' : sel.type === 'passive' ? '#4c4' : '#f80'), marginRight: '12px' }}>
                                        <DOTAAbilityImage abilityname={sel.icon} style={{ width: '100%', height: '100%' }} />
                                    </Panel>
                                    <Panel style={{ flowChildren: 'down' }}>
                                        <Label text={sel.name} style={{ fontSize: '20px', color: '#ffd700', fontWeight: 'bold' }} />
                                        <Label text={sel.type === 'active' ? '主动' : sel.type === 'passive' ? '被动' : '终极'} style={{ fontSize: '12px', color: sel.type === 'active' ?  '#48f' : sel.type === 'passive' ? '#4c4' : '#f80', marginTop: '4px' }} />
                                    </Panel>
                                </Panel>
                                <Panel style={{ width: '100%', height: '2px', backgroundColor: '#8b6914', marginBottom: '10px' }} />
                                <Panel style={{ padding: '8px', backgroundColor: '#0a0a05', border: '1px solid #3a3020', marginBottom: '8px', flowChildren: 'down' }}>
                                    <Label text={'等级: ' + getLv(sel.id) + '/' + sel.maxLv} style={{ fontSize: '14px', color: '#0f0' }} />
                                    <Label text={'需求: 角色Lv' + sel.reqLv} style={{ fontSize: '12px', color: heroLv >= sel.reqLv ? '#0f0' : '#f44', marginTop: '4px' }} />
                                </Panel>
                                <Panel style={{ padding: '8px', backgroundColor: '#080805', border: '1px solid #2a2520', marginBottom: '12px' }}>
                                    <Label text={sel.desc} style={{ fontSize: '12px', color: '#bbb' }} />
                                </Panel>
                                {sel.done ? (
                                    <Panel hittest={true} onactivate={doUpgrade} style={{ width: '160px', height: '36px', backgroundColor: canUp(sel) ? '#1a4a1a' : '#1a1a1a', border: canUp(sel) ? '2px solid #0a0' : '2px solid #333', horizontalAlign: 'center' }}>
                                        <Label text={getLv(sel.id) >= sel.maxLv ? '已满级' : '升级+1'} style={{ fontSize: '14px', color: canUp(sel) ? '#fff' : '#666', horizontalAlign: 'center', marginTop: '7px' }} />
                                    </Panel>
                                ) : (
                                    <Label text="[ 开发中 ]" style={{ fontSize: '13px', color: '#f60', horizontalAlign: 'center', marginTop: '15px' }} />
                                )}
                            </>
                        ) : (
                            <Label text="点击技能查看详情" style={{ fontSize: '13px', color: '#555', horizontalAlign: 'center', marginTop: '180px' }} />
                        )}
                    </Panel>
                </Panel>

                {/* 底部 */}
                <Panel style={{ width: '100%', height: '65px', backgroundColor: '#101010', borderTop: '2px solid #3a3020', flowChildren: 'right', horizontalAlign: 'center' }}>
                    <Panel hittest={true} onactivate={doReset} style={{ width: '130px', height: '36px', backgroundColor: '#2a1515', border: '2px solid #a33', marginTop: '14px', marginRight: '15px' }}>
                        <Label text="重置技能" style={{ fontSize: '14px', color: '#f66', horizontalAlign: 'center', marginTop: '7px' }} />
                    </Panel>
                    <Panel hittest={true} onactivate={onClose} style={{ width: '130px', height: '36px', backgroundColor: '#1a1a1a', border: '2px solid #666', marginTop: '14px' }}>
                        <Label text="关闭(K)" style={{ fontSize: '14px', color: '#ccc', horizontalAlign: 'center', marginTop: '7px' }} />
                    </Panel>
                </Panel>
            </Panel>
        </Panel>
    );
};