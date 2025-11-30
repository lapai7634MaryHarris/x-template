import React, { useState, useEffect, useRef } from 'react';

// ========== 数据 ==========
const SKILLS = [
    { id: 'warrior_deep_wound', name: '重伤', icon: 'bloodseeker_rupture', type: 'passive', maxLv: 1, reqLv: 1, done: true, baseDamage: 0, baseCooldown: 0, baseRange: 0, desc: '暴击时触发流血效果' },
    { id: 'warrior_thunder_strike', name: '雷霆一击', icon: 'sven_storm_bolt', type: 'active', maxLv: 5, reqLv: 1, done: true, baseDamage: 150, baseCooldown: 12, baseRange: 600, desc: '释放雷霆对区域内敌人造成伤害' },
    { id: 'warrior_sudden_death', name: '猝死', icon: 'skeleton_king_reincarnation', type: 'passive', maxLv: 5, reqLv: 5, done: true, baseDamage: 0, baseCooldown: 0, baseRange: 0, desc: '攻击有几率立即击杀低血量敌人' },
    { id: 'warrior_execute', name: '斩杀', icon: 'axe_culling_blade', type: 'ultimate', maxLv: 1, reqLv: 10, done: true, baseDamage: 500, baseCooldown: 60, baseRange: 150, desc: '对低血量敌人造成巨额伤害' },
    { id: 'warrior_strike', name: '猛击', icon: 'sven_great_cleave', type: 'active', maxLv: 5, reqLv: 1, done: false, baseDamage: 100, baseCooldown: 8, baseRange: 200, desc: '强力近战攻击' },
    { id: 'warrior_whirlwind', name: '旋风斩', icon: 'juggernaut_blade_fury', type: 'active', maxLv: 5, reqLv: 5, done: false, baseDamage: 80, baseCooldown: 15, baseRange: 300, desc: '旋转攻击周围敌人' },
    { id: 'warrior_warcry', name: '战吼', icon: 'sven_warcry', type: 'active', maxLv: 5, reqLv: 3, done: false, baseDamage: 0, baseCooldown: 20, baseRange: 900, desc: '提升周围友军属性' },
    { id: 'warrior_berserker', name: '狂战士', icon: 'huskar_berserkers_blood', type: 'passive', maxLv: 5, reqLv: 8, done: false, baseDamage: 0, baseCooldown: 0, baseRange: 0, desc: '血量越低伤害越高' },
    { id: 'warrior_bloodthirst', name: '嗜血', icon: 'bloodseeker_thirst', type: 'passive', maxLv: 5, reqLv: 5, done: false, baseDamage: 0, baseCooldown: 0, baseRange: 0, desc: '击杀敌人回复生命' },
    { id: 'warrior_armor_break', name: '破甲', icon: 'slardar_amplify_damage', type: 'active', maxLv: 5, reqLv: 6, done: false, baseDamage: 50, baseCooldown: 10, baseRange: 400, desc: '降低敌人护甲' },
    { id: 'warrior_charge', name: '冲锋', icon: 'spirit_breaker_charge_of_darkness', type: 'active', maxLv: 5, reqLv: 4, done: false, baseDamage: 120, baseCooldown: 14, baseRange: 800, desc: '向目标冲锋并造成伤害' },
    { id: 'warrior_block', name: '格挡', icon: 'tidehunter_kraken_shell', type: 'passive', maxLv: 5, reqLv: 3, done: false, baseDamage: 0, baseCooldown: 0, baseRange: 0, desc: '有几率格挡伤害' },
    { id: 'warrior_tenacity', name: '坚韧', icon: 'huskar_inner_fire', type: 'passive', maxLv: 5, reqLv: 2, done: false, baseDamage: 0, baseCooldown: 0, baseRange: 0, desc: '减少受到的控制时间' },
    { id: 'warrior_critical', name: '致命打击', icon: 'phantom_assassin_coup_de_grace', type: 'passive', maxLv: 5, reqLv: 7, done: false, baseDamage: 0, baseCooldown: 0, baseRange: 0, desc: '提升暴击率和暴击伤害' },
    { id: 'warrior_avatar', name: '战神降临', icon: 'sven_gods_strength', type: 'ultimate', maxLv: 3, reqLv: 15, done: false, baseDamage: 0, baseCooldown: 90, baseRange: 0, desc: '大幅提升自身战斗能力' },
];

interface Rune {
    id: string;
    name: string;
    icon: string;
    effectTypeName: string;
    quality: number;
    qualityName: string;
    rollValue: number;
    equippedTo: string;
    slotIndex: number;
}

const QCOLOR: Record<number, string> = { 1: '#fff', 2: '#0f0', 3: '#08f', 4: '#a0f', 5: '#f80' };
const QNAME: Record<number, string> = { 1: '普通', 2: '优秀', 3: '稀有', 4: '史诗', 5: '传说' };
const MATERIAL_COUNT: Record<number, number> = { 1: 1, 2: 2, 3: 5, 4: 10, 5: 25 };

export const SkillTreeUI: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
    const [tab, setTab] = useState(0);
    const [points, setPoints] = useState(0);
    const [levels, setLevels] = useState<Record<string, number>>({});
    const [heroLv, setHeroLv] = useState(1);
    const [selSkill, setSelSkill] = useState('');
    const [slots, setSlots] = useState({ q: '', w: '', e: '', r: '' });
    const [equipMode, setEquipMode] = useState(false);
    const [runes, setRunes] = useState<Rune[]>([]);
    const [runeSkill, setRuneSkill] = useState('');
    const [selRune, setSelRune] = useState('');
    const [hoverRune, setHoverRune] = useState<Rune | null>(null);
    const hoverTimeoutRef = useRef<number | null>(null);
    
    // 分解相关状态
    const [showDecompose, setShowDecompose] = useState(false);
    const [decomposeRune, setDecomposeRune] = useState<Rune | null>(null);
    
    // 详情页状态
    const [detailSkill, setDetailSkill] = useState('');

    useEffect(() => {
        if (!  visible) return;
        GameEvents.SendCustomGameEventToServer('skill_point_request_data' as never, {} as never);
        GameEvents.SendCustomGameEventToServer('skill_equip_request_data' as never, {} as never);
        GameEvents.SendCustomGameEventToServer('rune_request_data' as never, {} as never);

        const h1 = GameEvents.Subscribe('skill_point_data_update' as never, (d: any) => {
            if (d) {
                setPoints(d. availablePoints || 0);
                setLevels(d.skillLevels || {});
                setHeroLv(d. playerLevel || 1);
            }
        });
        const h2 = GameEvents.Subscribe('skill_equip_data_update' as never, (d: any) => {
            if (d && d.slots) {
                setSlots({ q: d.slots.q || '', w: d.slots.w || '', e: d.slots. e || '', r: d.slots.r || '' });
            }
        });
        const h3 = GameEvents.Subscribe('rune_data_update' as never, (d: any) => {
            const arr: Rune[] = [];
            if (d && d.runes) {
                for (const k in d.runes) {
                    const r = d.runes[k];
                    if (r && r.id) {
                        arr.push({
                            id: r.id + '',
                            name: r. name + '',
                            icon: r. icon + '',
                            effectTypeName: r.effectTypeName + '',
                            quality: +r.quality || 1,
                            qualityName: r.qualityName + '',
                            rollValue: +r.rollValue || 0,
                            equippedTo: r.equippedTo + '',
                            slotIndex: +r.slotIndex >= 0 ? +r.slotIndex : -1
                        });
                    }
                }
            }
            setRunes(arr);
        });

        return () => {
            GameEvents.Unsubscribe(h1);
            GameEvents. Unsubscribe(h2);
            GameEvents.Unsubscribe(h3);
            if (hoverTimeoutRef. current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, [visible]);

    if (!visible) return null;

    // ========== 工具函数 ==========
    const getLv = (id: string): number => levels[id] || 0;
    const isLearned = (id: string): boolean => getLv(id) > 0;
    const findSkill = (id: string) => SKILLS.find(s => s.id === id);
    const canUp = (id: string): boolean => {
        const s = findSkill(id);
        return ! !(s && s.done && points > 0 && getLv(id) < s.maxLv && heroLv >= s.reqLv);
    };

    // ========== 事件处理 ==========
    const upgrade = () => {
        if (selSkill && canUp(selSkill)) {
            GameEvents.SendCustomGameEventToServer('skill_point_upgrade_skill' as never, { skillId: selSkill } as never);
        }
    };
    const resetSkills = () => {
        GameEvents.SendCustomGameEventToServer('skill_point_reset' as never, {} as never);
    };
    const equipTo = (k: string) => {
        const s = findSkill(selSkill);
        if (s && isLearned(selSkill) && s.type !== 'passive') {
            GameEvents.SendCustomGameEventToServer('skill_equip_to_slot' as never, {
                skillId: selSkill,
                slot: k === 'q' ? 0 : k === 'w' ? 1 : k === 'e' ? 2 : 3
            } as never);
            setEquipMode(false);
        }
    };
    const equipRune = (rid: string, sid: string, slot: number) => {
        if (rid && sid) {
            GameEvents.SendCustomGameEventToServer('rune_equip' as never, { runeId: rid, skillId: sid, slotIndex: slot } as never);
            setSelRune('');
        }
    };
    const unequipRune = (rid: string) => {
        if (rid) {
            GameEvents.SendCustomGameEventToServer('rune_unequip' as never, { runeId: rid } as never);
        }
    };
    
    // 分解护石
    const decomposeRuneItem = (rune: Rune) => {
        if (rune && rune.id) {
            GameEvents.SendCustomGameEventToServer('rune_decompose' as never, { runeId: rune.id } as never);
            setShowDecompose(false);
            setDecomposeRune(null);
            setSelRune('');
        }
    };

    // ========== 悬停处理函数 ==========
    const handleRuneMouseOver = (rune: Rune) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setHoverRune(rune);
    };

    const handleRuneMouseOut = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoverRune(null);
        }, 200) as any;
    };

    const keepRuneHoverPanel = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    // ========== 技能详情计算 ==========
    const calcSkillStats = (skillId: string) => {
        const skill = findSkill(skillId);
        if (!skill) return null;

        const skillLevel = getLv(skillId);
        const equippedRunes = runes.filter(r => r.equippedTo === skillId);

        // 基础数值（根据技能等级计算）
        const baseDamage = skill.baseDamage + skillLevel * 30;
        const baseCooldown = skill.baseCooldown > 0 ? Math.max(1, skill.baseCooldown - skillLevel * 0.5) : 0;
        const baseRange = skill.baseRange;

        // 护石加成
        let damageBonus = 0;
        let cooldownReduction = 0;
        let rangeBonus = 0;
        let critBonus = 0;
        let lifestealBonus = 0;

        equippedRunes.forEach(r => {
            const effect = r.effectTypeName;
            if (effect === '伤害增幅' || effect. includes('伤害')) damageBonus += r.rollValue;
            else if (effect === '冷却缩减' || effect.includes('冷却')) cooldownReduction += r.rollValue;
            else if (effect === '范围扩大' || effect.includes('范围')) rangeBonus += r. rollValue;
            else if (effect === '暴击强化' || effect.includes('暴击')) critBonus += r.rollValue;
            else if (effect === '生命汲取' || effect.includes('吸血')) lifestealBonus += r.rollValue;
        });

        // 计算最终数值
        const finalDamage = Math.floor(baseDamage * (1 + damageBonus / 100));
        const finalCooldown = baseCooldown > 0 ?  Math.max(1, baseCooldown * (1 - cooldownReduction / 100)) : 0;
        const finalRange = Math.floor(baseRange * (1 + rangeBonus / 100));
        const dps = finalCooldown > 0 ? Math.floor(finalDamage / finalCooldown) : 0;

        return {
            skillLevel,
            baseDamage,
            finalDamage,
            damageBonus,
            baseCooldown,
            finalCooldown: finalCooldown. toFixed(1),
            cooldownReduction,
            baseRange,
            finalRange,
            rangeBonus,
            critChance: critBonus,
            lifesteal: lifestealBonus,
            dps,
            runeCount: equippedRunes.length
        };
    };

    const sk = selSkill ? findSkill(selSkill) : null;
    const slotStatus = 'Q:' + (slots.q ?  '有' : '-') + ' W:' + (slots.w ? '有' : '-') + ' E:' + (slots. e ? '有' : '-') + ' R:' + (slots.r ? '有' : '-');

    // ========== 护石悬浮提示 ==========
    const renderRuneTooltip = () => {
        if (!hoverRune) return null;

        return (
            <Panel
                hittest={true}
                style={{
                    width: '200px',
                    backgroundColor: '#1a1a1aee',
                    border: '2px solid ' + (QCOLOR[hoverRune. quality] || '#333'),
                    padding: '12px',
                    flowChildren: 'down',
                }}
                onmouseover={keepRuneHoverPanel}
                onmouseout={handleRuneMouseOut}
            >
                <Label text={hoverRune.name} style={{ fontSize: '16px', color: QCOLOR[hoverRune.quality] || '#fff', fontWeight: 'bold', marginBottom: '8px' }} />
                <Panel style={{ width: '100%', height: '1px', backgroundColor: '#555', marginBottom: '8px' }} />
                <Label text={'品质: ' + (QNAME[hoverRune. quality] || '未知')} style={{ fontSize: '12px', color: QCOLOR[hoverRune. quality] || '#888', marginBottom: '4px' }} />
                <Label text={'效果: ' + hoverRune.effectTypeName} style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }} />
                <Label text={'数值: +' + hoverRune.rollValue + '%'} style={{ fontSize: '14px', color: '#0f0', marginBottom: '8px' }} />
                <Panel style={{ width: '100%', height: '1px', backgroundColor: '#555', marginBottom: '8px' }} />
                <Label text={hoverRune.equippedTo ?  '已绑定技能' : '未绑定'} style={{ fontSize: '11px', color: hoverRune.equippedTo ? '#f80' : '#888' }} />
            </Panel>
        );
    };

    // ========== 分解确认弹窗 ==========
const renderDecomposeModal = () => {
    if (!showDecompose || !decomposeRune) return null;

    return (
        <Panel
            hittest={true}
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#000000aa',
                horizontalAlign: 'center',
                verticalAlign: 'center',
            }}
            onactivate={() => { setShowDecompose(false); setDecomposeRune(null); }}
        >
            <Panel
                hittest={true}
                style={{
                    width: '300px',
                    backgroundColor: '#1a1a1a',
                    border: '2px solid #f80',
                    padding: '20px',
                    flowChildren: 'down',
                    horizontalAlign: 'center',
                    verticalAlign: 'center',
                }}
                onactivate={() => {}}
            >
                <Label text="确认分解" style={{ fontSize: '18px', color: '#f80', marginBottom: '15px' }} />
                <Panel style={{ flowChildren: 'right', marginBottom: '15px' }}>
                    <DOTAItemImage itemname={decomposeRune.icon} style={{ width: '44px', height: '44px', marginRight: '10px' }} />
                    <Panel style={{ flowChildren: 'down' }}>
                        <Label text={decomposeRune.name} style={{ fontSize: '14px', color: QCOLOR[decomposeRune.quality] || '#fff' }} />
                        <Label text={decomposeRune.qualityName} style={{ fontSize: '11px', color: '#888' }} />
                    </Panel>
                </Panel>
                <Panel style={{ width: '100%', height: '1px', backgroundColor: '#333', marginBottom: '15px' }} />
                <Label text="分解可获得:" style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }} />
                <Label text={(QNAME[decomposeRune.quality] || '普通') + '材料 x' + (MATERIAL_COUNT[decomposeRune.quality] || 1)} style={{ fontSize: '16px', color: QCOLOR[decomposeRune.quality] || '#fff', marginBottom: '20px' }} />
                <Panel style={{ flowChildren: 'right' }}>
                    <Panel hittest={true} onactivate={() => decomposeRuneItem(decomposeRune)} style={{ width: '80px', height: '32px', backgroundColor: '#4a1a1a', border: '2px solid #f44', marginRight: '20px' }}>
                        <Label text="分解" style={{ fontSize: '12px', color: '#f44', horizontalAlign: 'center', marginTop: '6px' }} />
                    </Panel>
                    <Panel hittest={true} onactivate={() => { setShowDecompose(false); setDecomposeRune(null); }} style={{ width: '80px', height: '32px', backgroundColor: '#1a1a1a', border: '2px solid #666' }}>
                        <Label text="取消" style={{ fontSize: '12px', color: '#aaa', horizontalAlign: 'center', marginTop: '6px' }} />
                    </Panel>
                </Panel>
            </Panel>
        </Panel>
    );
};

    // ========== 详情页 ==========
    const renderDetailTab = () => {
        const learnedSkills = SKILLS.filter(s => s. done && isLearned(s.id));
        const stats = detailSkill ? calcSkillStats(detailSkill) : null;
        const skill = detailSkill ? findSkill(detailSkill) : null;

        return (
            <Panel style={{ width: '100%', height: '100%', flowChildren: 'right' }}>
                {/* 左侧：技能列表 */}
                <Panel style={{ width: '200px', height: '100%', backgroundColor: '#0a0a0a', padding: '10px', flowChildren: 'down' }}>
                    <Label text="已学技能" style={{ fontSize: '14px', color: '#fa0', marginBottom: '10px' }} />
                    <Panel style={{ flowChildren: 'down', height: '520px', overflow: 'scroll' }}>
                        {learnedSkills.length === 0 ? (
                            <Label text="暂无已学技能" style={{ fontSize: '11px', color: '#555', marginTop: '50px', horizontalAlign: 'center' }} />
                        ) : (
                            learnedSkills. map(s => {
                                const runeCount = runes.filter(r => r.equippedTo === s.id).length;
                                return (
                                    <Panel key={s.id} hittest={true} onactivate={() => setDetailSkill(s. id)} style={{ flowChildren: 'right', height: '50px', marginBottom: '6px', backgroundColor: detailSkill === s.id ? '#3a2a1a' : '#151515', border: detailSkill === s.id ?  '2px solid #fa0' : '1px solid #333', padding: '3px' }}>
                                        <Panel style={{ width: '44px', height: '44px' }}>
                                            <DOTAAbilityImage abilityname={s.icon} style={{ width: '100%', height: '100%' }} />
                                        </Panel>
                                        <Panel style={{ flowChildren: 'down', marginLeft: '8px' }}>
                                            <Label text={s.name} style={{ fontSize: '12px', color: detailSkill === s.id ?  '#fa0' : '#ccc' }} />
                                            <Label text={'Lv.' + getLv(s.id) + ' 护石:' + runeCount} style={{ fontSize: '10px', color: '#888' }} />
                                        </Panel>
                                    </Panel>
                                );
                            })
                        )}
                    </Panel>
                </Panel>

                {/* 右侧：详细数据 */}
                <Panel style={{ width: '800px', height: '100%', backgroundColor: '#0c0c08', padding: '20px', flowChildren: 'down' }}>
                    {skill && stats ?  (
                        <Panel style={{ flowChildren: 'down', width: '100%' }}>
                            {/* 技能头部 */}
                            <Panel style={{ flowChildren: 'right', marginBottom: '20px' }}>
                                <Panel style={{ width: '64px', height: '64px', border: '2px solid #fa0', marginRight: '15px' }}>
                                    <DOTAAbilityImage abilityname={skill.icon} style={{ width: '100%', height: '100%' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'down' }}>
                                    <Label text={skill.name} style={{ fontSize: '22px', color: '#fa0' }} />
                                    <Label text={'等级 ' + stats.skillLevel + '/' + skill.maxLv + ' | 护石 ' + stats. runeCount + '/5'} style={{ fontSize: '12px', color: '#888', marginTop: '5px' }} />
                                    <Label text={skill.desc || ''} style={{ fontSize: '11px', color: '#aaa', marginTop: '5px' }} />
                                </Panel>
                            </Panel>

                            <Panel style={{ width: '100%', height: '2px', backgroundColor: '#3a3020', marginBottom: '20px' }} />

                            {/* 核心数据 */}
                            <Label text="核心属性" style={{ fontSize: '14px', color: '#fa0', marginBottom: '15px' }} />
                            <Panel style={{ flowChildren: 'right', marginBottom: '20px' }}>
                                {/* DPS */}
                                <Panel style={{ width: '160px', height: '90px', backgroundColor: '#1a1510', border: '1px solid #3a3020', marginRight: '15px', flowChildren: 'down', padding: '10px' }}>
                                    <Label text="秒伤 DPS" style={{ fontSize: '11px', color: '#888' }} />
                                    <Label text={'' + stats.dps} style={{ fontSize: '28px', color: '#f44', marginTop: '5px' }} />
                                    <Label text="伤害/秒" style={{ fontSize: '9px', color: '#666' }} />
                                </Panel>
                                {/* 伤害 */}
                                <Panel style={{ width: '160px', height: '90px', backgroundColor: '#1a1510', border: '1px solid #3a3020', marginRight: '15px', flowChildren: 'down', padding: '10px' }}>
                                    <Label text="单次伤害" style={{ fontSize: '11px', color: '#888' }} />
                                    <Label text={'' + stats.finalDamage} style={{ fontSize: '28px', color: '#fa0', marginTop: '5px' }} />
                                    {stats.damageBonus > 0 ?  <Label text={'(+' + stats.damageBonus + '%)'} style={{ fontSize: '10px', color: '#0f0' }} /> : <Label text={'基础: ' + stats.baseDamage} style={{ fontSize: '9px', color: '#666' }} />}
                                </Panel>
                                {/* 冷却 */}
                                <Panel style={{ width: '160px', height: '90px', backgroundColor: '#1a1510', border: '1px solid #3a3020', marginRight: '15px', flowChildren: 'down', padding: '10px' }}>
                                    <Label text="冷却时间" style={{ fontSize: '11px', color: '#888' }} />
                                    <Label text={stats.finalCooldown + 's'} style={{ fontSize: '28px', color: '#0af', marginTop: '5px' }} />
                                    {stats.cooldownReduction > 0 ? <Label text={'(-' + stats.cooldownReduction + '%)'} style={{ fontSize: '10px', color: '#0f0' }} /> : <Label text={'基础: ' + stats.baseCooldown + 's'} style={{ fontSize: '9px', color: '#666' }} />}
                                </Panel>
                                {/* 范围 */}
                                <Panel style={{ width: '160px', height: '90px', backgroundColor: '#1a1510', border: '1px solid #3a3020', flowChildren: 'down', padding: '10px' }}>
                                    <Label text="技能范围" style={{ fontSize: '11px', color: '#888' }} />
                                    <Label text={'' + stats.finalRange} style={{ fontSize: '28px', color: '#0f0', marginTop: '5px' }} />
                                    {stats.rangeBonus > 0 ? <Label text={'(+' + stats.rangeBonus + '%)'} style={{ fontSize: '10px', color: '#0f0' }} /> : <Label text={'基础: ' + stats.baseRange} style={{ fontSize: '9px', color: '#666' }} />}
                                </Panel>
                            </Panel>

                            {/* 额外属性 */}
                            <Label text="护石加成" style={{ fontSize: '14px', color: '#fa0', marginBottom: '15px' }} />
                            <Panel style={{ flowChildren: 'right', marginBottom: '20px' }}>
                                <Panel style={{ width: '140px', height: '70px', backgroundColor: '#1a1510', border: '1px solid #3a3020', marginRight: '15px', flowChildren: 'down', padding: '10px' }}>
                                    <Label text="暴击率" style={{ fontSize: '10px', color: '#888' }} />
                                    <Label text={'+' + stats.critChance + '%'} style={{ fontSize: '20px', color: stats.critChance > 0 ? '#f0a' : '#555', marginTop: '5px' }} />
                                </Panel>
                                <Panel style={{ width: '140px', height: '70px', backgroundColor: '#1a1510', border: '1px solid #3a3020', marginRight: '15px', flowChildren: 'down', padding: '10px' }}>
                                    <Label text="吸血" style={{ fontSize: '10px', color: '#888' }} />
                                    <Label text={'+' + stats.lifesteal + '%'} style={{ fontSize: '20px', color: stats.lifesteal > 0 ? '#0f0' : '#555', marginTop: '5px' }} />
                                </Panel>
                                <Panel style={{ width: '140px', height: '70px', backgroundColor: '#1a1510', border: '1px solid #3a3020', marginRight: '15px', flowChildren: 'down', padding: '10px' }}>
                                    <Label text="伤害加成" style={{ fontSize: '10px', color: '#888' }} />
                                    <Label text={'+' + stats.damageBonus + '%'} style={{ fontSize: '20px', color: stats.damageBonus > 0 ? '#fa0' : '#555', marginTop: '5px' }} />
                                </Panel>
                                <Panel style={{ width: '140px', height: '70px', backgroundColor: '#1a1510', border: '1px solid #3a3020', flowChildren: 'down', padding: '10px' }}>
                                    <Label text="冷却缩减" style={{ fontSize: '10px', color: '#888' }} />
                                    <Label text={'+' + stats.cooldownReduction + '%'} style={{ fontSize: '20px', color: stats.cooldownReduction > 0 ? '#0af' : '#555', marginTop: '5px' }} />
                                </Panel>
                            </Panel>

                            {/* 已装备护石 */}
                            <Label text="已装备护石" style={{ fontSize: '14px', color: '#fa0', marginBottom: '10px' }} />
                            <Panel style={{ flowChildren: 'right' }}>
                                {runes.filter(r => r. equippedTo === detailSkill).length === 0 ?  (
                                    <Label text="未装备护石" style={{ fontSize: '11px', color: '#555' }} />
                                ) : (
                                    runes.filter(r => r.equippedTo === detailSkill).map(r => (
                                        <Panel key={r.id} style={{ width: '140px', backgroundColor: '#1a1a1a', border: '1px solid ' + (QCOLOR[r.quality] || '#333'), marginRight: '10px', padding: '8px', flowChildren: 'down' }}>
                                            <Label text={r.name} style={{ fontSize: '11px', color: QCOLOR[r.quality] || '#fff' }} />
                                            <Label text={r.effectTypeName + ' +' + r.rollValue + '%'} style={{ fontSize: '10px', color: '#0f0', marginTop: '3px' }} />
                                        </Panel>
                                    ))
                                )}
                            </Panel>
                        </Panel>
                    ) : (
                        <Label text="← 选择技能查看详情" style={{ fontSize: '14px', color: '#555', horizontalAlign: 'center', marginTop: '200px' }} />
                    )}
                </Panel>
            </Panel>
        );
    };

    return (
        <Panel style={{ width: '100%', height: '100%', backgroundColor: '#000000cc' }}>
            <Panel style={{ width: '1000px', height: '680px', backgroundColor: '#111', border: '3px solid #8b6914', horizontalAlign: 'center', verticalAlign: 'center', flowChildren: 'down' }}>

                {/* ========== 标题栏 ========== */}
                <Panel style={{ width: '100%', height: '50px', backgroundColor: '#1a1a15', borderBottom: '2px solid #8b6914', flowChildren: 'right' }}>
                    <Panel hittest={true} onactivate={() => {
                        setTab(0);
                        setEquipMode(false);
                        setHoverRune(null);
                    }} style={{ width: '80px', height: '50px', backgroundColor: tab === 0 ? '#1a3a1a' : '#1a1a15' }}>
                        <Label text="技能" style={{ fontSize: '15px', color: tab === 0 ? '#0f0' : '#888', horizontalAlign: 'center', marginTop: '15px' }} />
                    </Panel>
                    <Panel hittest={true} onactivate={() => {
                        setTab(1);
                        setSelRune('');
                        setEquipMode(false);
                        setHoverRune(null);
                    }} style={{ width: '80px', height: '50px', backgroundColor: tab === 1 ? '#1a1a3a' : '#1a1a15' }}>
                        <Label text="护石" style={{ fontSize: '15px', color: tab === 1 ? '#a0f' : '#888', horizontalAlign: 'center', marginTop: '15px' }} />
                    </Panel>
                    <Panel hittest={true} onactivate={() => {
                        setTab(2);
                        setEquipMode(false);
                        setHoverRune(null);
                    }} style={{ width: '80px', height: '50px', backgroundColor: tab === 2 ? '#3a2a1a' : '#1a1a15' }}>
                        <Label text="详情" style={{ fontSize: '15px', color: tab === 2 ? '#fa0' : '#888', horizontalAlign: 'center', marginTop: '15px' }} />
                    </Panel>
                    <Panel style={{ width: '210px' }} />
                    <Label text={slotStatus} style={{ fontSize: '12px', color: '#aaa', marginTop: '18px', marginRight: '20px' }} />
                    <Label text={'点数:' + points + '  Lv' + heroLv + '  护石:' + runes.length} style={{ fontSize: '14px', color: '#888', marginTop: '16px' }} />
                </Panel>

                {/* ========== 内容区域 ========== */}
                <Panel style={{ width: '100%', height: '570px' }}>
                    {tab === 0 ? (
                        // ===== 技能页 =====
                        <Panel style={{ width: '100%', height: '100%', flowChildren: 'right' }}>
                            {/* 技能网格 */}
                            <Panel style={{ width: '600px', height: '100%', backgroundColor: '#0a0a0a', padding: '10px', flowChildren: 'down' }}>
                                {[0, 1, 2]. map(row => (
                                    <Panel key={'r' + row} style={{ flowChildren: 'right' }}>
                                        {SKILLS. slice(row * 5, row * 5 + 5). map(s => {
                                            const lv = getLv(s.id);
                                            const isSel = selSkill === s.id;
                                            const isEquipped = slots. q === s.id || slots.w === s.id || slots.e === s.id || slots.r === s.id;
                                            const typeColor = s.type === 'active' ? '#0af' : s.type === 'passive' ?  '#fa0' : '#f0a';
                                            return (
                                                <Panel key={s.id} hittest={true} onactivate={() => setSelSkill(s. id)} style={{ width: '110px', height: '130px', margin: '3px', backgroundColor: isSel ?  '#1a2a1a' : '#151515', border: '2px solid ' + (isSel ? '#0f0' : isEquipped ? '#0af' : '#333'), flowChildren: 'down' }}>
                                                    <Panel style={{ width: '60px', height: '60px', marginTop: '6px', marginLeft: '22px', border: '1px solid #333' }}>
                                                        <DOTAAbilityImage abilityname={s. icon} style={{ width: '100%', height: '100%', opacity: s.done ? '1' : '0.3' }} />
                                                    </Panel>
                                                    <Label text={s.name} style={{ fontSize: '11px', color: s.done ? '#ccc' : '#555', horizontalAlign: 'center', marginTop: '4px' }} />
                                                    <Label text={lv + '/' + s.maxLv} style={{ fontSize: '10px', color: lv > 0 ? '#0f0' : '#666', horizontalAlign: 'center' }} />
                                                    <Panel style={{ flowChildren: 'right', horizontalAlign: 'center', marginTop: '2px' }}>
                                                        <Label text={s.type === 'active' ? '主动' : s.type === 'passive' ? '被动' : '终极'} style={{ fontSize: '8px', color: typeColor, marginRight: '5px' }} />
                                                        {isEquipped && <Label text="★" style={{ fontSize: '10px', color: '#0af' }} />}
                                                    </Panel>
                                                </Panel>
                                            );
                                        })}
                                    </Panel>
                                ))}
                            </Panel>

                            {/* 技能详情 */}
                            <Panel style={{ width: '400px', height: '100%', backgroundColor: '#0c0c08', padding: '15px', flowChildren: 'down' }}>
                                {sk ?  (
                                    <Panel style={{ flowChildren: 'down' }}>
                                        <Panel style={{ flowChildren: 'right', marginBottom: '15px' }}>
                                            <Panel style={{ width: '60px', height: '60px', border: '2px solid #ffd700', marginRight: '15px' }}>
                                                <DOTAAbilityImage abilityname={sk.icon} style={{ width: '100%', height: '100%' }} />
                                            </Panel>
                                            <Panel style={{ flowChildren: 'down' }}>
                                                <Label text={sk.name} style={{ fontSize: '18px', color: '#ffd700' }} />
                                                <Label text={sk.type === 'active' ? '主动' : sk.type === 'passive' ? '被动' : '终极'} style={{ fontSize: '12px', color: '#888', marginTop: '5px' }} />
                                            </Panel>
                                        </Panel>
                                        <Label text={'等级: ' + getLv(selSkill) + '/' + sk.maxLv + '  需求Lv' + sk.reqLv} style={{ fontSize: '13px', color: '#0f0', marginBottom: '10px' }} />
                                        <Label text={sk.desc || '技能描述待配置'} style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }} />
                                        {sk.type !== 'passive' && (
                                            <Panel style={{ marginBottom: '15px' }}>
                                                <Label
                                                    text={
                                                        slots.q === selSkill ? '已装备到 Q 槽' :
                                                        slots. w === selSkill ? '已装备到 W 槽' :
                                                        slots.e === selSkill ? '已装备到 E 槽' :
                                                        slots.r === selSkill ?  '已装备到 R 槽' :
                                                        '未装备'
                                                    }
                                                    style={{ fontSize: '11px', color: (slots.q === selSkill || slots.w === selSkill || slots.e === selSkill || slots.r === selSkill) ? '#0af' : '#666' }}
                                                />
                                            </Panel>
                                        )}
                                        <Panel style={{ flowChildren: 'right', marginBottom: '20px' }}>
                                            <Panel hittest={true} onactivate={upgrade} style={{ width: '80px', height: '32px', backgroundColor: canUp(selSkill) ? '#1a4a1a' : '#1a1a1a', border: '2px solid #333', marginRight: '10px' }}>
                                                <Label text="升级" style={{ fontSize: '13px', color: canUp(selSkill) ? '#0f0' : '#666', horizontalAlign: 'center', marginTop: '6px' }} />
                                            </Panel>
                                            {sk.type !== 'passive' && isLearned(selSkill) && (
                                                <Panel hittest={true} onactivate={() => setEquipMode(! equipMode)} style={{ width: '80px', height: '32px', backgroundColor: equipMode ? '#2a3a4a' : '#1a2a3a', border: '2px solid #048' }}>
                                                    <Label text={equipMode ? '取消' : '装备'} style={{ fontSize: '13px', color: '#0af', horizontalAlign: 'center', marginTop: '6px' }} />
                                                </Panel>
                                            )}
                                        </Panel>
                                        {equipMode && (
                                            <Panel style={{ flowChildren: 'down' }}>
                                                <Label text="选择技能槽:" style={{ fontSize: '12px', color: '#0af', marginBottom: '10px' }} />
                                                <Panel style={{ flowChildren: 'right' }}>
                                                    {['q', 'w', 'e', 'r'].map(k => {
                                                        const canEquip = (k === 'r' && sk.type === 'ultimate') || (k !== 'r' && sk.type === 'active');
                                                        const currentSkillId = slots[k as keyof typeof slots];
                                                        const currentSkill = currentSkillId ? findSkill(currentSkillId) : null;
                                                        return (
                                                            <Panel key={k} style={{ flowChildren: 'down', margin: '5px', width: '70px' }}>
                                                                <Panel hittest={canEquip} onactivate={() => canEquip && equipTo(k)} style={{ width: '60px', height: '60px', backgroundColor: canEquip ? '#1a2a1a' : '#1a1a1a', border: '2px solid ' + (canEquip ? '#0f0' : '#333') }}>
                                                                    {currentSkill ? (
                                                                        <DOTAAbilityImage abilityname={currentSkill.icon} style={{ width: '100%', height: '100%', opacity: '0.7' }} />
                                                                    ) : (
                                                                        <Label text={k. toUpperCase()} style={{ fontSize: '20px', color: canEquip ? '#0f0' : '#444', horizontalAlign: 'center', verticalAlign: 'center' }} />
                                                                    )}
                                                                </Panel>
                                                                <Label text={currentSkill ?  currentSkill.name : '空'} style={{ fontSize: '9px', color: '#888', horizontalAlign: 'center', marginTop: '3px' }} />
                                                            </Panel>
                                                        );
                                                    })}
                                                </Panel>
                                                <Label text="点击槽位装备当前技能" style={{ fontSize: '10px', color: '#555', marginTop: '10px' }} />
                                            </Panel>
                                        )}
                                    </Panel>
                                ) : (
                                    <Label text="选择技能" style={{ fontSize: '14px', color: '#555', horizontalAlign: 'center', marginTop: '200px' }} />
                                )}
                            </Panel>
                        </Panel>
                    ) : tab === 1 ? (
                        // ===== 护石页 =====
                        <Panel style={{ width: '100%', height: '100%', flowChildren: 'right' }}>
                            {/* 左侧：已学技能列表 */}
                            <Panel style={{ width: '180px', height: '100%', backgroundColor: '#0a0a0a', padding: '10px', flowChildren: 'down' }}>
                                <Label text="已学技能" style={{ fontSize: '14px', color: '#ffd700', marginBottom: '10px' }} />
                                <Panel style={{ flowChildren: 'down', height: '520px', overflow: 'scroll' }}>
                                    {SKILLS.filter(s => s.done && isLearned(s.id)). map(s => {
                                        const cnt = runes.filter(r => r. equippedTo === s.id).length;
                                        return (
                                            <Panel key={s.id} hittest={true} onactivate={() => { setRuneSkill(s.id); setSelRune(''); }} style={{ flowChildren: 'right', height: '50px', marginBottom: '5px', backgroundColor: runeSkill === s.id ?  '#1a2a1a' : '#0c0c0c', border: runeSkill === s.id ?  '2px solid #0f0' : '1px solid #333', padding: '3px' }}>
                                                <Panel style={{ width: '44px', height: '44px' }}>
                                                    <DOTAAbilityImage abilityname={s.icon} style={{ width: '100%', height: '100%' }} />
                                                </Panel>
                                                <Panel style={{ flowChildren: 'down', marginLeft: '8px' }}>
                                                    <Label text={s.name} style={{ fontSize: '12px', color: runeSkill === s.id ?  '#0f0' : '#ccc' }} />
                                                    <Label text={'护石:' + cnt + '/5'} style={{ fontSize: '10px', color: '#888' }} />
                                                </Panel>
                                            </Panel>
                                        );
                                    })}
                                </Panel>
                            </Panel>

                            {/* 中间：护石槽位 */}
                            <Panel style={{ width: '320px', height: '100%', backgroundColor: '#0c0c08', padding: '15px', flowChildren: 'down' }}>
                                {runeSkill ? (
                                    <Panel style={{ flowChildren: 'down' }}>
                                        <Label text={(findSkill(runeSkill)?.name || '') + ' 护石'} style={{ fontSize: '16px', color: '#ffd700', marginBottom: '15px' }} />
                                        <Label text="槽位(3开+2锁)" style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }} />
                                        <Panel style={{ flowChildren: 'right', marginBottom: '15px' }}>
                                            {[0, 1, 2, 3, 4]. map(i => {
                                                const locked = i >= 3;
                                                const inSlot = runes.find(r => r.equippedTo === runeSkill && r.slotIndex === i);
                                                const canDrop = !locked && !inSlot && selRune;
                                                return (
                                                    <Panel key={i} hittest={! locked && !inSlot} onactivate={() => { if (canDrop) equipRune(selRune, runeSkill, i); }} style={{ width: '50px', height: '50px', margin: '3px', backgroundColor: locked ? '#111' : canDrop ? '#1a3a1a' : '#0c0c0c', border: locked ? '2px solid #222' : canDrop ? '2px solid #0f0' : '2px solid #444' }}>
                                                        {locked ?  (
                                                            <Label text="🔒" style={{ fontSize: '14px', color: '#333', horizontalAlign: 'center', verticalAlign: 'center' }} />
                                                        ) : inSlot ? (
                                                            <DOTAItemImage itemname={inSlot.icon} style={{ width: '100%', height: '100%' }} />
                                                        ) : (
                                                            <Label text="+" style={{ fontSize: '16px', color: canDrop ? '#0f0' : '#333', horizontalAlign: 'center', verticalAlign: 'center' }} />
                                                        )}
                                                    </Panel>
                                                );
                                            })}
                                        </Panel>
                                        <Label text="已装备:" style={{ fontSize: '12px', color: '#a0f', marginBottom: '8px' }} />
                                        <Panel style={{ flowChildren: 'down', height: '280px', overflow: 'scroll' }}>
                                            {runes.filter(r => r. equippedTo === runeSkill).map(r => (
                                                <Panel key={r.id} style={{ flowChildren: 'right', height: '40px', marginBottom: '4px', backgroundColor: '#1a1a1a', border: '1px solid ' + (QCOLOR[r.quality] || '#333'), padding: '3px' }}>
                                                    <DOTAItemImage itemname={r.icon} style={{ width: '34px', height: '34px' }} />
                                                    <Panel style={{ flowChildren: 'down', marginLeft: '8px', width: '150px' }}>
                                                        <Label text={r.name} style={{ fontSize: '11px', color: QCOLOR[r.quality] || '#fff' }} />
                                                        <Label text={r.effectTypeName + ' +' + r.rollValue + '%'} style={{ fontSize: '9px', color: '#0f0' }} />
                                                    </Panel>
                                                    <Panel hittest={true} onactivate={() => unequipRune(r.id)} style={{ width: '32px', height: '22px', backgroundColor: '#400', marginTop: '6px' }}>
                                                        <Label text="卸" style={{ fontSize: '10px', color: '#f66', horizontalAlign: 'center', marginTop: '3px' }} />
                                                    </Panel>
                                                </Panel>
                                            ))}
                                        </Panel>
                                    </Panel>
                                ) : (
                                    <Label text="← 选择技能" style={{ fontSize: '14px', color: '#555', horizontalAlign: 'center', marginTop: '200px' }} />
                                )}
                            </Panel>

                            {/* 右侧：护石背包 */}
                            <Panel style={{ width: '280px', height: '100%', backgroundColor: '#080808', padding: '15px', flowChildren: 'down' }}>
                                <Label text="护石背包" style={{ fontSize: '14px', color: '#a0f', marginBottom: '10px' }} />
                                <Label text={selRune ? '已选择 (右键分解)' : '点击选择'} style={{ fontSize: '10px', color: selRune ? '#0f0' : '#888', marginBottom: '10px' }} />
                                <Panel style={{ flowChildren: 'down', height: '490px', overflow: 'scroll' }}>
                                    {runes.filter(r => ! r.equippedTo).map(r => (
                                        <Panel
                                            key={r.id}
                                            hittest={true}
                                            onactivate={() => setSelRune(selRune === r.id ? '' : r.id)}
                                            onmouseover={() => handleRuneMouseOver(r)}
                                            onmouseout={handleRuneMouseOut}
                                            style={{
                                                flowChildren: 'right',
                                                height: '50px',
                                                marginBottom: '4px',
                                                backgroundColor: selRune === r.id ?  '#2a2a3a' : '#1a1a1a',
                                                border: '1px solid ' + (QCOLOR[r.quality] || '#333'),
                                                padding: '3px'
                                            }}
                                        >
                                            <DOTAItemImage itemname={r.icon} style={{ width: '44px', height: '44px' }} />
                                            <Panel style={{ flowChildren: 'down', marginLeft: '8px', width: '140px' }}>
                                                <Label text={r.name} style={{ fontSize: '11px', color: QCOLOR[r. quality] || '#fff' }} />
                                                <Label text={r.qualityName} style={{ fontSize: '9px', color: '#888' }} />
                                                <Label text={r.effectTypeName + ' +' + r. rollValue + '%'} style={{ fontSize: '9px', color: '#0f0' }} />
                                            </Panel>
                                            <Panel hittest={true} onactivate={() => { setDecomposeRune(r); setShowDecompose(true); }} style={{ width: '32px', height: '24px', backgroundColor: '#2a1a1a', marginTop: '10px' }}>
                                                <Label text="分解" style={{ fontSize: '9px', color: '#f80', horizontalAlign: 'center', marginTop: '5px' }} />
                                            </Panel>
                                        </Panel>
                                    ))}
                                </Panel>
                            </Panel>

                            {/* 悬浮提示面板 */}
                            {renderRuneTooltip()}
                        </Panel>
                    ) : (
                        // ===== 详情页 =====
                        renderDetailTab()
                    )}
                </Panel>

                {/* ========== 底部按钮 ========== */}
                <Panel style={{ width: '100%', height: '60px', backgroundColor: '#101010', borderTop: '2px solid #3a3020', flowChildren: 'right', horizontalAlign: 'center' }}>
                    <Panel hittest={true} onactivate={resetSkills} style={{ width: '100px', height: '34px', backgroundColor: '#2a1515', border: '2px solid #a33', marginTop: '13px', marginRight: '20px' }}>
                        <Label text="重置技能" style={{ fontSize: '12px', color: '#f66', horizontalAlign: 'center', marginTop: '8px' }} />
                    </Panel>
                    <Panel hittest={true} onactivate={onClose} style={{ width: '100px', height: '34px', backgroundColor: '#1a1a1a', border: '2px solid #666', marginTop: '13px' }}>
                        <Label text="关闭(K)" style={{ fontSize: '12px', color: '#ccc', horizontalAlign: 'center', marginTop: '8px' }} />
                    </Panel>
                </Panel>

            </Panel>
            
            {/* 分解确认弹窗 */}
            {renderDecomposeModal()}
        </Panel>
    );
};