import React, { useState, useEffect } from 'react';

interface EquipmentStat { attribute: string; value: number; }
interface EquippedItem { name: string; type: string; icon: string; stats: EquipmentStat[]; }

const SLOT_ICONS: Record<string, string> = { helmet: '⛑️', necklace: '📿', ring: '💍', trinket: '✨', weapon: '⚔️', armor: '🛡️', belt: '🎗️', boots: '🥾' };
const SLOT_NAMES: Record<string, string> = { helmet: '头盔', necklace: '项链', ring: '戒指', trinket: '饰品', weapon: '武器', armor: '护甲', belt: '腰带', boots: '鞋子' };

export const EquipmentUI: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
    const [tab, setTab] = useState(0);
    const [equippedItems, setEquippedItems] = useState<Record<string, EquippedItem | null>>({
        helmet: null, necklace: null, ring: null, trinket: null, weapon: null, armor: null, belt: null, boots: null,
    });
    const [charStats, setCharStats] = useState({
        increasedDamage: 0, increasedPhysicalDamage: 0, increasedElementalDamage: 0,
        increasedFireDamage: 0, increasedColdDamage: 0, increasedLightningDamage: 0,
        moreDamageValues: [] as number[], critChance: 5, critMultiplier: 150,
        projectileDamage: 0, areaDamage: 0, meleeDamage: 0, spellDamage: 0, attackDamage: 0, dotDamage: 0,
        cooldownReduction: 0, areaOfEffect: 0, attackSpeed: 0, castSpeed: 0, lifesteal: 0,
    });

    useEffect(() => {
        if (! visible) return;
        (GameEvents.SendCustomGameEventToServer as any)('request_equipment_data', { PlayerID: Players.GetLocalPlayer() });
        (GameEvents.SendCustomGameEventToServer as any)('request_character_stats', { PlayerID: Players.GetLocalPlayer() });

        const h1 = GameEvents.Subscribe('update_equipment_ui', (data: any) => {
            if (data && data.equipment) {
                const processed: Record<string, EquippedItem | null> = {};
                for (const slot in data.equipment) {
                    const item = data.equipment[slot];
                    if (item) {
                        processed[slot] = { ... item, stats: Array.isArray(item.stats) ? item.stats : Object.values(item.stats || {}) };
                    } else {
                        processed[slot] = null;
                    }
                }
                setEquippedItems(prev => ({ ...prev, ...processed }));
            }
        });
        const h2 = GameEvents.Subscribe('update_character_stats', (data: any) => {
            if (data) {
                setCharStats(prev => ({
                    ...prev,
                    increasedDamage: data.increasedDamage || 0,
                    increasedPhysicalDamage: data.increasedPhysicalDamage || 0,
                    increasedElementalDamage: data.increasedElementalDamage || 0,
                    increasedFireDamage: data.increasedFireDamage || 0,
                    increasedColdDamage: data.increasedColdDamage || 0,
                    increasedLightningDamage: data.increasedLightningDamage || 0,
                    moreDamageValues: Array.isArray(data.moreDamageValues) ? data.moreDamageValues : [],
                    critChance: data.critChance || 5,
                    critMultiplier: data.critMultiplier || 150,
                    projectileDamage: data.projectileDamage || 0,
                    areaDamage: data. areaDamage || 0,
                    meleeDamage: data.meleeDamage || 0,
                    spellDamage: data.spellDamage || 0,
                    attackDamage: data.attackDamage || 0,
                    dotDamage: data.dotDamage || 0,
                    cooldownReduction: data.cooldownReduction || 0,
                    areaOfEffect: data. areaOfEffect || 0,
                    attackSpeed: data. attackSpeed || 0,
                    castSpeed: data.castSpeed || 0,
                    lifesteal: data.lifesteal || 0,
                }));
            }
        });
        return () => { GameEvents.Unsubscribe(h1); GameEvents.Unsubscribe(h2); };
    }, [visible]);

    if (!visible) return null;

    const unequipItem = (slot: string) => {
        (GameEvents.SendCustomGameEventToServer as any)('unequip_item', { PlayerID: Players.GetLocalPlayer(), slot: slot });
        Game.EmitSound('ui. crafting_gem_create');
    };

    const getQualityColor = (item: EquippedItem): string => {
        const statsArr = item.stats || [];
        const total = statsArr.reduce((sum, s) => sum + (s.value || 0), 0);
        if (total >= 50) return '#ff8000';
        if (total >= 35) return '#a335ee';
        if (total >= 20) return '#0070dd';
        if (total >= 10) return '#1eff00';
        return '#9d9d9d';
    };

    const getTotalStats = (): Record<string, number> => {
        const stats: Record<string, number> = {};
        Object.values(equippedItems).forEach(item => {
            if (item && item.stats) {
                item.stats.forEach(s => {
                    if (s && s.attribute) {
                        stats[s. attribute] = (stats[s. attribute] || 0) + (s.value || 0);
                    }
                });
            }
        });
        return stats;
    };

    const totalStats = getTotalStats();
    const moreValues = charStats.moreDamageValues || [];
    const moreMultiplier = moreValues.length > 0 ? moreValues.reduce((m, v) => m * (1 + (v || 0) / 100), 1) : 1;
    const increasedTotal = (charStats.increasedDamage || 0) + (charStats.increasedPhysicalDamage || 0) + (charStats. increasedElementalDamage || 0);
    const critChance = charStats.critChance || 5;
    const critMultiplier = charStats.critMultiplier || 150;
    const critExpected = 1 + (critChance / 100) * ((critMultiplier - 100) / 100);
    const equipCount = Object.values(equippedItems).filter(i => i !== null).length;

    return (
        <Panel style={{ width: '100%', height: '100%', backgroundColor: '#000000cc' }}>
            <Panel style={{ width: '920px', height: '750px', backgroundColor: '#1c1410', border: '4px solid #8b7355', horizontalAlign: 'center', verticalAlign: 'center', flowChildren: 'down' }}>
                
                {/* 标题栏 */}
                <Panel style={{ width: '100%', height: '60px', backgroundColor: '#2a1f1a', borderBottom: '3px solid #8b7355', flowChildren: 'right' }}>
                    <Panel hittest={true} onactivate={() => setTab(0)} style={{ width: '120px', height: '60px', backgroundColor: tab === 0 ? '#3a2a1a' : '#1a1a15' }}>
                        <Label text="⚔️ 装备" style={{ fontSize: '18px', color: tab === 0 ? '#ffd700' : '#888', horizontalAlign: 'center', marginTop: '18px' }} />
                    </Panel>
                    <Panel hittest={true} onactivate={() => setTab(1)} style={{ width: '120px', height: '60px', backgroundColor: tab === 1 ? '#1a2a3a' : '#1a1a15' }}>
                        <Label text="📊 详情" style={{ fontSize: '18px', color: tab === 1 ? '#0af' : '#888', horizontalAlign: 'center', marginTop: '18px' }} />
                    </Panel>
                    <Panel style={{ width: '400px' }} />
                    <Label text={'装备数: ' + equipCount + '/8'} style={{ fontSize: '14px', color: '#888', marginTop: '20px' }} />
                </Panel>

                {/* 内容 */}
                <Panel style={{ width: '100%', height: '630px' }}>
                    {tab === 0 ? (
                        // ===== 装备页 =====
                        <Panel style={{ width: '100%', height: '100%', flowChildren: 'right', padding: '20px' }}>
                            {/* 左侧槽位 */}
                            <Panel style={{ width: '250px', height: '100%', flowChildren: 'down' }}>
                                {['helmet', 'necklace', 'ring', 'trinket']. map(slot => {
                                    const item = equippedItems[slot];
                                    const hasItem = item !== null;
                                    const itemStats = hasItem && item.stats ? item.stats : [];
                                    return (
                                        <Panel key={slot} hittest={true} onactivate={() => { if (hasItem) unequipItem(slot); }} style={{ width: '220px', height: '130px', margin: '8px', backgroundColor: hasItem ? '#1a1a1a' : '#0a0a0a', border: hasItem ? '3px solid ' + getQualityColor(item!) : '2px solid #3a3a3a', flowChildren: 'right', padding: '10px' }}>
                                            <Panel style={{ width: '70px', height: '70px', backgroundColor: '#0a0a0a', border: '1px solid #555' }}>
                                                {hasItem ?  (
                                                    <Image src={item! .icon || ''} style={{ width: '100%', height: '100%' }} />
                                                ) : (
                                                    <Label text={SLOT_ICONS[slot] || '? '} style={{ fontSize: '36px', color: '#555', horizontalAlign: 'center', verticalAlign: 'center' }} />
                                                )}
                                            </Panel>
                                            <Panel style={{ width: '120px', marginLeft: '10px', flowChildren: 'down' }}>
                                                <Label text={hasItem ? (item!.name || '未知') : SLOT_NAMES[slot]} style={{ fontSize: '14px', color: hasItem ? getQualityColor(item!) : '#666', fontWeight: 'bold' }} />
                                                {hasItem && itemStats.slice(0, 3).map((s, i) => (
                                                    <Label key={i} text={'+' + (s.value || 0) + ' ' + (s.attribute || '')} style={{ fontSize: '12px', color: '#0f0', marginTop: '2px' }} />
                                                ))}
                                                {hasItem && <Label text="点击卸下" style={{ fontSize: '10px', color: '#888', marginTop: '5px' }} />}
                                            </Panel>
                                        </Panel>
                                    );
                                })}
                            </Panel>

                            {/* 中间 */}
                            <Panel style={{ width: '350px', height: '100%', flowChildren: 'down', padding: '20px' }}>
                                <Label text="总属性加成" style={{ fontSize: '20px', color: '#ffd700', marginBottom: '15px' }} />
                                <Panel style={{ width: '100%', height: '200px', backgroundColor: '#0a0a0a', border: '2px solid #555', padding: '15px', flowChildren: 'down' }}>
                                    {Object.keys(totalStats).length > 0 ? Object.entries(totalStats).map(([attr, val]) => (
                                        <Label key={attr} text={attr + ': +' + val} style={{ fontSize: '16px', color: '#0f0', marginBottom: '6px' }} />
                                    )) : (
                                        <Label text="未装备任何装备" style={{ fontSize: '14px', color: '#666', horizontalAlign: 'center', marginTop: '60px' }} />
                                    )}
                                </Panel>
                                <Panel style={{ width: '100%', height: '280px', backgroundColor: '#0a0a0a', border: '2px solid #555', marginTop: '20px' }}>
                                    <Label text="🦸" style={{ fontSize: '100px', horizontalAlign: 'center', verticalAlign: 'center' }} />
                                </Panel>
                            </Panel>

                            {/* 右侧槽位 */}
                            <Panel style={{ width: '250px', height: '100%', flowChildren: 'down' }}>
                                {['weapon', 'armor', 'belt', 'boots'].map(slot => {
                                    const item = equippedItems[slot];
                                    const hasItem = item !== null;
                                    const itemStats = hasItem && item. stats ? item.stats : [];
                                    return (
                                        <Panel key={slot} hittest={true} onactivate={() => { if (hasItem) unequipItem(slot); }} style={{ width: '220px', height: '130px', margin: '8px', backgroundColor: hasItem ?  '#1a1a1a' : '#0a0a0a', border: hasItem ? '3px solid ' + getQualityColor(item!) : '2px solid #3a3a3a', flowChildren: 'right', padding: '10px' }}>
                                            <Panel style={{ width: '70px', height: '70px', backgroundColor: '#0a0a0a', border: '1px solid #555' }}>
                                                {hasItem ? (
                                                    <Image src={item!.icon || ''} style={{ width: '100%', height: '100%' }} />
                                                ) : (
                                                    <Label text={SLOT_ICONS[slot] || '?'} style={{ fontSize: '36px', color: '#555', horizontalAlign: 'center', verticalAlign: 'center' }} />
                                                )}
                                            </Panel>
                                            <Panel style={{ width: '120px', marginLeft: '10px', flowChildren: 'down' }}>
                                                <Label text={hasItem ? (item!.name || '未知') : SLOT_NAMES[slot]} style={{ fontSize: '14px', color: hasItem ? getQualityColor(item!) : '#666', fontWeight: 'bold' }} />
                                                {hasItem && itemStats.slice(0, 3).map((s, i) => (
                                                    <Label key={i} text={'+' + (s.value || 0) + ' ' + (s.attribute || '')} style={{ fontSize: '12px', color: '#0f0', marginTop: '2px' }} />
                                                ))}
                                                {hasItem && <Label text="点击卸下" style={{ fontSize: '10px', color: '#888', marginTop: '5px' }} />}
                                            </Panel>
                                        </Panel>
                                    );
                                })}
                            </Panel>
                        </Panel>
                    ) : (
                        // ===== 详情页 =====
                        <Panel style={{ width: '100%', height: '100%', flowChildren: 'right', padding: '20px' }}>
                            {/* 左列 - 增幅 */}
                            <Panel style={{ width: '280px', height: '100%', backgroundColor: '#0a0a0a', border: '2px solid #333', padding: '15px', flowChildren: 'down', marginRight: '15px' }}>
                                <Label text="增幅伤害 (Increased)" style={{ fontSize: '16px', color: '#0f0', marginBottom: '5px' }} />
                                <Panel style={{ width: '100%', height: '2px', backgroundColor: '#0f0', opacity: '0.5', marginBottom: '10px' }} />
                                <Label text="同类加法叠加" style={{ fontSize: '10px', color: '#666', marginBottom: '15px' }} />
                                
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="通用增伤" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.increasedDamage || 0) + '%'} style={{ fontSize: '14px', color: '#0f0' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="物理增伤" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.increasedPhysicalDamage || 0) + '%'} style={{ fontSize: '14px', color: '#f80' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="元素增伤" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.increasedElementalDamage || 0) + '%'} style={{ fontSize: '14px', color: '#0af' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="火焰增伤" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.increasedFireDamage || 0) + '%'} style={{ fontSize: '14px', color: '#f44' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="冰霜增伤" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.increasedColdDamage || 0) + '%'} style={{ fontSize: '14px', color: '#4af' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '15px' }}>
                                    <Label text="闪电增伤" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.increasedLightningDamage || 0) + '%'} style={{ fontSize: '14px', color: '#ff0' }} />
                                </Panel>
                                
                                <Panel style={{ backgroundColor: '#1a2a1a', padding: '10px', flowChildren: 'right' }}>
                                    <Label text="增幅乘区" style={{ fontSize: '14px', color: '#888', width: '100px' }} />
                                    <Label text={'x' + (1 + increasedTotal / 100). toFixed(3)} style={{ fontSize: '16px', color: '#0f0', fontWeight: 'bold' }} />
                                </Panel>
                            </Panel>

                            {/* 中列 - 额外+暴击 */}
                            <Panel style={{ width: '280px', height: '100%', backgroundColor: '#0a0a0a', border: '2px solid #333', padding: '15px', flowChildren: 'down', marginRight: '15px' }}>
                                <Label text="额外伤害 (More)" style={{ fontSize: '16px', color: '#f80', marginBottom: '5px' }} />
                                <Panel style={{ width: '100%', height: '2px', backgroundColor: '#f80', opacity: '0.5', marginBottom: '10px' }} />
                                <Label text="独立乘法叠加 (珍贵)" style={{ fontSize: '10px', color: '#666', marginBottom: '15px' }} />
                                
                                {moreValues.length > 0 ? moreValues.map((v, i) => (
                                    <Panel key={i} style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                        <Label text={'额外伤害 #' + (i + 1)} style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                        <Label text={(v || 0) + '%'} style={{ fontSize: '14px', color: '#f80' }} />
                                    </Panel>
                                )) : (
                                    <Label text="无额外伤害来源" style={{ fontSize: '12px', color: '#555', marginBottom: '15px' }} />
                                )}
                                
                                <Panel style={{ backgroundColor: '#2a1a0a', padding: '10px', flowChildren: 'right', marginBottom: '20px' }}>
                                    <Label text="额外乘区" style={{ fontSize: '14px', color: '#888', width: '100px' }} />
                                    <Label text={'x' + moreMultiplier.toFixed(3)} style={{ fontSize: '16px', color: '#f80', fontWeight: 'bold' }} />
                                </Panel>

                                <Label text="暴击" style={{ fontSize: '16px', color: '#f0a', marginBottom: '5px', marginTop: '10px' }} />
                                <Panel style={{ width: '100%', height: '2px', backgroundColor: '#f0a', opacity: '0.5', marginBottom: '15px' }} />
                                
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="暴击率" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={critChance + '%'} style={{ fontSize: '14px', color: critChance > 5 ? '#f0a' : '#fff' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '15px' }}>
                                    <Label text="暴击伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={critMultiplier + '%'} style={{ fontSize: '14px', color: critMultiplier > 150 ? '#f0a' : '#fff' }} />
                                </Panel>
                                
                                <Panel style={{ backgroundColor: '#2a1a2a', padding: '10px', flowChildren: 'right' }}>
                                    <Label text="暴击乘区(期望)" style={{ fontSize: '14px', color: '#888', width: '100px' }} />
                                    <Label text={'x' + critExpected.toFixed(3)} style={{ fontSize: '16px', color: '#f0a', fontWeight: 'bold' }} />
                                </Panel>
                            </Panel>

                            {/* 右列 - 技能类型+其他 */}
                            <Panel style={{ width: '280px', height: '100%', backgroundColor: '#0a0a0a', border: '2px solid #333', padding: '15px', flowChildren: 'down' }}>
                                <Label text="技能类型伤害" style={{ fontSize: '16px', color: '#0af', marginBottom: '5px' }} />
                                <Panel style={{ width: '100%', height: '2px', backgroundColor: '#0af', opacity: '0. 5', marginBottom: '10px' }} />
                                <Label text="按技能标签生效" style={{ fontSize: '10px', color: '#666', marginBottom: '15px' }} />
                                
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="投射物伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.projectileDamage || 0) + '%'} style={{ fontSize: '14px', color: '#0af' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="范围伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.areaDamage || 0) + '%'} style={{ fontSize: '14px', color: '#0af' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="近战伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.meleeDamage || 0) + '%'} style={{ fontSize: '14px', color: '#0af' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="法术伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.spellDamage || 0) + '%'} style={{ fontSize: '14px', color: '#0af' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="攻击伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.attackDamage || 0) + '%'} style={{ fontSize: '14px', color: '#0af' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '20px' }}>
                                    <Label text="持续伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.dotDamage || 0) + '%'} style={{ fontSize: '14px', color: '#0af' }} />
                                </Panel>

                                <Label text="其他属性" style={{ fontSize: '16px', color: '#888', marginBottom: '5px' }} />
                                <Panel style={{ width: '100%', height: '2px', backgroundColor: '#888', opacity: '0.5', marginBottom: '15px' }} />
                                
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="冷却缩减" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.cooldownReduction || 0) + '%'} style={{ fontSize: '14px', color: '#8af' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="范围扩大" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.areaOfEffect || 0) + '%'} style={{ fontSize: '14px', color: '#8af' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="攻击速度" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.attackSpeed || 0) + '%'} style={{ fontSize: '14px', color: '#8af' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="施法速度" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.castSpeed || 0) + '%'} style={{ fontSize: '14px', color: '#8af' }} />
                                </Panel>
                                <Panel style={{ flowChildren: 'right', marginBottom: '6px' }}>
                                    <Label text="生命偷取" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                    <Label text={(charStats.lifesteal || 0) + '%'} style={{ fontSize: '14px', color: '#8f8' }} />
                                </Panel>
                            </Panel>
                        </Panel>
                    )}
                </Panel>

                {/* 底部 */}
                <Panel style={{ width: '100%', height: '60px', backgroundColor: '#101010', borderTop: '2px solid #3a3020', flowChildren: 'right', horizontalAlign: 'center' }}>
                    <Panel hittest={true} onactivate={onClose} style={{ width: '100px', height: '34px', backgroundColor: '#1a1a1a', border: '2px solid #666', marginTop: '13px' }}>
                        <Label text="关闭(C)" style={{ fontSize: '12px', color: '#ccc', horizontalAlign: 'center', marginTop: '8px' }} />
                    </Panel>
                </Panel>
            </Panel>
        </Panel>
    );
};