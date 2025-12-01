import React, { useState, useEffect } from 'react';

interface EquipmentStat { attribute: string; value: number; }

// ⭐ 新增：词缀详情接口
interface AffixDetail {
    position: 'prefix' | 'suffix';
    tier: number;
    name: string;
    description: string;
    color?: string;
}

// ⭐ 修改：添加 affixDetails
interface EquippedItem { 
    name: string; 
    type: string; 
    icon: string; 
    stats: EquipmentStat[]; 
    rarity?: number;
    affixDetails?: AffixDetail[];
}

interface CharStats {
    increasedDamage: number;
    increasedPhysicalDamage: number;
    increasedElementalDamage: number;
    increasedFireDamage: number;
    increasedColdDamage: number;
    increasedLightningDamage: number;
    moreDamageValues: number[];
    critChance: number;
    critMultiplier: number;
    projectileDamage: number;
    areaDamage: number;
    meleeDamage: number;
    spellDamage: number;
    attackDamage: number;
    dotDamage: number;
    cooldownReduction: number;
    areaOfEffect: number;
    attackSpeed: number;
    castSpeed: number;
    lifesteal: number;
}

const DEFAULT_STATS: CharStats = {
    increasedDamage: 0,
    increasedPhysicalDamage: 0,
    increasedElementalDamage: 0,
    increasedFireDamage: 0,
    increasedColdDamage: 0,
    increasedLightningDamage: 0,
    moreDamageValues: [],
    critChance: 5,
    critMultiplier: 150,
    projectileDamage: 0,
    areaDamage: 0,
    meleeDamage: 0,
    spellDamage: 0,
    attackDamage: 0,
    dotDamage: 0,
    cooldownReduction: 0,
    areaOfEffect: 0,
    attackSpeed: 0,
    castSpeed: 0,
    lifesteal: 0,
};

const SLOT_ICONS: Record<string, string> = { 
    helmet: '⛑️', 
    necklace: '📿', 
    ring: '💍', 
    trinket: '✨', 
    weapon: '⚔️', 
    armor: '🛡️', 
    belt: '🎗️', 
    boots: '🥾' 
};

const SLOT_NAMES: Record<string, string> = { 
    helmet: '头盔', 
    necklace: '项链', 
    ring: '戒指', 
    trinket: '饰品', 
    weapon: '武器', 
    armor: '护甲', 
    belt: '腰带', 
    boots: '鞋子' 
};

// ⭐ 辅助函数：提取前后缀（修复版 - 添加空值检查）
const extractAffixes = (affixDetails: any) => {
    const prefixes: any[] = [];
    const suffixes: any[] = [];
    
    // ⭐ 添加空值检查
    if (!affixDetails) {
        return { prefixes, suffixes };
    }
    
    // ⭐ 安全遍历
    try {
        for (const key in affixDetails) {
            const affix = affixDetails[key];
            // ⭐ 确保 affix 存在且是对象
            if (affix && typeof affix === 'object' && affix.position) {
                if (affix.position === 'prefix') {
                    prefixes. push(affix);
                } else if (affix.position === 'suffix') {
                    suffixes.push(affix);
                }
            }
        }
    } catch (e) {
        // 忽略错误，返回空数组
    }
    
    return { prefixes, suffixes };
};

export const EquipmentUI: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
    const [tab, setTab] = useState(0);
    
    // 装备状态 - 每个槽位独立
    const [helmet, setHelmet] = useState<EquippedItem | null>(null);
    const [necklace, setNecklace] = useState<EquippedItem | null>(null);
    const [ring, setRing] = useState<EquippedItem | null>(null);
    const [trinket, setTrinket] = useState<EquippedItem | null>(null);
    const [weapon, setWeapon] = useState<EquippedItem | null>(null);
    const [armor, setArmor] = useState<EquippedItem | null>(null);
    const [belt, setBelt] = useState<EquippedItem | null>(null);
    const [boots, setBoots] = useState<EquippedItem | null>(null);
    
    // 角色属性状态
    const [charStats, setCharStats] = useState<CharStats>(DEFAULT_STATS);

    // 数据加载
    useEffect(() => {
        if (!  visible) return;
        
        (GameEvents.SendCustomGameEventToServer as any)('request_equipment_data', { PlayerID: Players.GetLocalPlayer() });
        (GameEvents.SendCustomGameEventToServer as any)('request_character_stats', { PlayerID: Players.GetLocalPlayer() });

        // 监听装备数据
        const h1 = GameEvents.Subscribe('update_equipment_ui', (data: any) => {
            if (data && data.equipment) {
                const eq = data.equipment;
                
                // ⭐ 处理每个槽位（添加 affixDetails）
                if (eq.helmet) {
                    const statsArr = eq.helmet.stats ?   (Array.isArray(eq.helmet. stats) ? eq.helmet.stats : Object.values(eq.helmet.stats)) : [];
                    setHelmet({ 
                        name: eq.helmet.name || '', 
                        type: eq. helmet.type || '', 
                        icon: eq.helmet.icon || '', 
                        stats: statsArr as EquipmentStat[],
                        rarity: eq.helmet.rarity,
                        affixDetails: eq.helmet.affixDetails
                    });
                } else {
                    setHelmet(null);
                }
                
                if (eq.necklace) {
                    const statsArr = eq.necklace.stats ?   (Array.isArray(eq.necklace.stats) ?  eq.necklace.stats : Object.values(eq.necklace.stats)) : [];
                    setNecklace({ 
                        name: eq.necklace.name || '', 
                        type: eq.necklace.type || '', 
                        icon: eq.necklace. icon || '', 
                        stats: statsArr as EquipmentStat[],
                        rarity: eq.necklace. rarity,
                        affixDetails: eq.necklace. affixDetails
                    });
                } else {
                    setNecklace(null);
                }
                
                if (eq.ring) {
                    const statsArr = eq.ring.stats ?  (Array.isArray(eq. ring.stats) ? eq.ring.stats : Object.values(eq.ring.stats)) : [];
                    setRing({ 
                        name: eq.ring. name || '', 
                        type: eq.ring.type || '', 
                        icon: eq. ring.icon || '', 
                        stats: statsArr as EquipmentStat[],
                        rarity: eq.ring. rarity,
                        affixDetails: eq.ring.affixDetails
                    });
                } else {
                    setRing(null);
                }
                
                if (eq.trinket) {
                    const statsArr = eq.trinket.stats ?  (Array.isArray(eq. trinket.stats) ? eq. trinket.stats : Object.values(eq.trinket.stats)) : [];
                    setTrinket({ 
                        name: eq.trinket.name || '', 
                        type: eq. trinket.type || '', 
                        icon: eq.trinket.icon || '', 
                        stats: statsArr as EquipmentStat[],
                        rarity: eq.trinket. rarity,
                        affixDetails: eq.trinket.affixDetails
                    });
                } else {
                    setTrinket(null);
                }
                
                if (eq. weapon) {
                    const statsArr = eq.weapon.stats ?  (Array.isArray(eq. weapon.stats) ? eq.weapon.stats : Object.values(eq.weapon.stats)) : [];
                    setWeapon({ 
                        name: eq.weapon.name || '', 
                        type: eq.weapon.type || '', 
                        icon: eq.weapon.icon || '', 
                        stats: statsArr as EquipmentStat[],
                        rarity: eq.weapon.rarity,
                        affixDetails: eq.weapon.affixDetails
                    });
                } else {
                    setWeapon(null);
                }
                
                if (eq. armor) {
                    const statsArr = eq.armor.stats ?  (Array.isArray(eq. armor.stats) ? eq.armor.stats : Object.values(eq.armor.stats)) : [];
                    setArmor({ 
                        name: eq.armor.name || '', 
                        type: eq.armor.type || '', 
                        icon: eq.armor.icon || '', 
                        stats: statsArr as EquipmentStat[],
                        rarity: eq.armor.rarity,
                        affixDetails: eq.armor.affixDetails
                    });
                } else {
                    setArmor(null);
                }
                
                if (eq. belt) {
                    const statsArr = eq.belt.stats ?  (Array.isArray(eq. belt.stats) ? eq.belt.stats : Object.values(eq.belt.stats)) : [];
                    setBelt({ 
                        name: eq.belt.name || '', 
                        type: eq.belt.type || '', 
                        icon: eq.belt.icon || '', 
                        stats: statsArr as EquipmentStat[],
                        rarity: eq.belt.rarity,
                        affixDetails: eq.belt.affixDetails
                    });
                } else {
                    setBelt(null);
                }
                
                if (eq.boots) {
                    const statsArr = eq. boots.stats ? (Array.isArray(eq.boots.stats) ? eq.boots.stats : Object.values(eq.boots.stats)) : [];
                    setBoots({ 
                        name: eq.boots.name || '', 
                        type: eq.boots.type || '', 
                        icon: eq.boots.icon || '', 
                        stats: statsArr as EquipmentStat[],
                        rarity: eq.boots.rarity,
                        affixDetails: eq. boots.affixDetails
                    });
                } else {
                    setBoots(null);
                }
            }
        });
        
        // 监听角色属性数据
        const h2 = GameEvents.Subscribe('update_character_stats', (data: any) => {
            if (data) {
                const moreArr = data.moreDamageValues;
                let safeMoreArr: number[] = [];
                if (moreArr && typeof moreArr === 'object') {
                    for (const k in moreArr) {
                        safeMoreArr.push(moreArr[k] || 0);
                    }
                }
                
                setCharStats({
                    increasedDamage: data.increasedDamage || 0,
                    increasedPhysicalDamage: data. increasedPhysicalDamage || 0,
                    increasedElementalDamage: data.increasedElementalDamage || 0,
                    increasedFireDamage: data. increasedFireDamage || 0,
                    increasedColdDamage: data.increasedColdDamage || 0,
                    increasedLightningDamage: data. increasedLightningDamage || 0,
                    moreDamageValues: safeMoreArr,
                    critChance: data.critChance || 5,
                    critMultiplier: data.critMultiplier || 150,
                    projectileDamage: data.projectileDamage || 0,
                    areaDamage: data.areaDamage || 0,
                    meleeDamage: data.meleeDamage || 0,
                    spellDamage: data.spellDamage || 0,
                    attackDamage: data.attackDamage || 0,
                    dotDamage: data.dotDamage || 0,
                    cooldownReduction: data. cooldownReduction || 0,
                    areaOfEffect: data.areaOfEffect || 0,
                    attackSpeed: data.attackSpeed || 0,
                    castSpeed: data. castSpeed || 0,
                    lifesteal: data.lifesteal || 0,
                });
            }
        });
        
        return () => { 
            GameEvents.Unsubscribe(h1); 
            GameEvents.Unsubscribe(h2); 
        };
    }, [visible]);

    if (!visible) return null;

    // 卸下装备
    const unequipItem = (slot: string) => {
        (GameEvents.SendCustomGameEventToServer as any)('unequip_item', { PlayerID: Players.GetLocalPlayer(), slot: slot });
        Game.EmitSound('ui. crafting_gem_create');
    };

    // 获取品质颜色
    const getQualityColor = (item: EquippedItem): string => {
        if (item.rarity !== undefined) {
            const rarityColors: Record<number, string> = {
                0: '#c8c8c8',  // 普通
                1: '#8888ff',  // 魔法
                2: '#ffff77',  // 稀有
                3: '#ff8800',  // 传说
            };
            return rarityColors[item.rarity] || '#9d9d9d';
        }
        
        const statsArr = item.stats || [];
        let total = 0;
        for (let i = 0; i < statsArr.length; i++) {
            total += statsArr[i]. value || 0;
        }
        if (total >= 50) return '#ff8000';
        if (total >= 35) return '#a335ee';
        if (total >= 20) return '#0070dd';
        if (total >= 10) return '#1eff00';
        return '#9d9d9d';
    };

    // 计算装备数量
    const getEquipCount = (): number => {
        let count = 0;
        if (helmet) count++;
        if (necklace) count++;
        if (ring) count++;
        if (trinket) count++;
        if (weapon) count++;
        if (armor) count++;
        if (belt) count++;
        if (boots) count++;
        return count;
    };

    const equipCount = getEquipCount();

    // 计算伤害乘区
    const moreArr = charStats.moreDamageValues || [];
    let moreMultiplier = 1;
    for (let i = 0; i < moreArr.length; i++) {
        moreMultiplier = moreMultiplier * (1 + (moreArr[i] || 0) / 100);
    }
    const increasedTotal = (charStats.increasedDamage || 0) + (charStats.increasedPhysicalDamage || 0) + (charStats.increasedElementalDamage || 0);
    const increasedMultiplier = 1 + increasedTotal / 100;
    const critChance = charStats.critChance || 5;
    const critMultiplier = charStats.critMultiplier || 150;
    const critExpected = 1 + (critChance / 100) * ((critMultiplier - 100) / 100);

    // ========== 装备槽位组件 ==========
    const EquipSlot: React.FC<{ item: EquippedItem | null; slotName: string }> = ({ item, slotName }) => {
        const hasItem = item !== null;
        const slotLabel = SLOT_NAMES[slotName] || slotName;
        const slotIcon = SLOT_ICONS[slotName] || '?  ';
        const qualityColor = hasItem ? getQualityColor(item) : '#3a3a3a';
        
        // ⭐ 提取前后缀
        const { prefixes, suffixes } = hasItem && item.affixDetails ? extractAffixes(item.affixDetails) : { prefixes: [], suffixes: [] };
        
        return (
            <Panel 
                hittest={true} 
                onactivate={() => { if (hasItem) unequipItem(slotName); }} 
                style={{ 
                    width: '220px', 
                    height: '150px', 
                    margin: '6px', 
                    backgroundColor: hasItem ? '#1a1a1a' : '#0a0a0a', 
                    border: hasItem ? '3px solid ' + qualityColor : '2px solid #3a3a3a', 
                    flowChildren: 'right', 
                    padding: '10px' 
                }}
            >
                {/* 图标区域 */}
                <Panel style={{ width: '70px', height: '70px', backgroundColor: '#0a0a0a', border: '1px solid #555' }}>
                    {hasItem ?   (
                        <Image src={item.icon} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <Label text={slotIcon} style={{ fontSize: '36px', color: '#555', horizontalAlign: 'center', verticalAlign: 'center' }} />
                    )}
                </Panel>
                
                {/* 信息区域 */}
                <Panel style={{ width: '120px', marginLeft: '10px', flowChildren: 'down' }}>
                    <Label 
                        text={hasItem ? item.name : slotLabel} 
                        style={{ 
                            fontSize: '13px', 
                            color: hasItem ?   qualityColor : '#666',
                            fontWeight: 'bold',
                            marginBottom: '5px'
                        }} 
                    />
                    
                    {/* ⭐ 显示前缀 */}
                    {hasItem && prefixes.length > 0 && prefixes.map((affix: any, idx: number) => (
                        <Label 
                            key={`prefix-${idx}`}
                            text={`[T${affix.tier}] ${affix.name} ${affix.description}`}
                            style={{ fontSize: '10px', color: '#8888ff', marginBottom: '1px' }} 
                        />
                    ))}
                    
                    {/* ⭐ 显示后缀 */}
                    {hasItem && suffixes.length > 0 && suffixes.map((affix: any, idx: number) => (
                        <Label 
                            key={`suffix-${idx}`}
                            text={`[T${affix.tier}] ${affix.name} ${affix.description}`}
                            style={{ fontSize: '10px', color: '#ffff77', marginBottom: '1px' }} 
                        />
                    ))}
                    
                    {hasItem && (
                        <Label text="点击卸下" style={{ fontSize: '10px', color: '#888', marginTop: '5px', fontStyle: 'italic' }} />
                    )}
                </Panel>
            </Panel>
        );
    };

    // ========== 装备页面 ==========
    const EquipmentTab = () => (
        <Panel style={{ width: '100%', height: '100%', flowChildren: 'right', padding: '20px' }}>
            {/* 左侧槽位 */}
            <Panel style={{ width: '250px', height: '100%', flowChildren: 'down' }}>
                <EquipSlot item={helmet} slotName="helmet" />
                <EquipSlot item={necklace} slotName="necklace" />
                <EquipSlot item={ring} slotName="ring" />
                <EquipSlot item={trinket} slotName="trinket" />
            </Panel>

            {/* 中间区域 */}
            <Panel style={{ width: '370px', height: '100%', flowChildren: 'down', padding: '15px' }}>
                <Label text="装备预览" style={{ fontSize: '22px', color: '#ffd700', marginBottom: '15px', fontWeight: 'bold' }} />
                
                {/* 角色模型区域 */}
                <Panel style={{ 
                    width: '100%', 
                    height: '500px', 
                    backgroundColor: '#0a0a0a', 
                    border: '2px solid #555' 
                }}>
                    <Label text="🦸" style={{ fontSize: '120px', horizontalAlign: 'center', verticalAlign: 'center' }} />
                </Panel>
            </Panel>

            {/* 右侧槽位 */}
            <Panel style={{ width: '250px', height: '100%', flowChildren: 'down' }}>
                <EquipSlot item={weapon} slotName="weapon" />
                <EquipSlot item={armor} slotName="armor" />
                <EquipSlot item={belt} slotName="belt" />
                <EquipSlot item={boots} slotName="boots" />
            </Panel>
        </Panel>
    );

    // ========== 详情页面 ==========
    const DetailTab = () => (
        <Panel style={{ width: '100%', height: '100%', flowChildren: 'right', padding: '20px' }}>
            {/* 左列 - 增幅伤害 */}
            <Panel style={{ width: '280px', height: '100%', backgroundColor: '#0a0a0a', border: '2px solid #333', padding: '15px', flowChildren: 'down', marginRight: '15px' }}>
                <Label text="增幅伤害 (Increased)" style={{ fontSize: '16px', color: '#0f0', fontWeight: 'bold', marginBottom: '5px' }} />
                <Panel style={{ width: '100%', height: '2px', backgroundColor: '#0f0', opacity: '0.5', marginBottom: '10px' }} />
                <Label text="同类加法叠加" style={{ fontSize: '10px', color: '#666', marginBottom: '15px' }} />
                
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="通用增伤" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.increasedDamage + '%'} style={{ fontSize: '14px', color: '#0f0', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="物理增伤" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.increasedPhysicalDamage + '%'} style={{ fontSize: '14px', color: '#f80', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="元素增伤" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats. increasedElementalDamage + '%'} style={{ fontSize: '14px', color: '#0af', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="火焰增伤" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.increasedFireDamage + '%'} style={{ fontSize: '14px', color: '#f44', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="冰霜增伤" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.increasedColdDamage + '%'} style={{ fontSize: '14px', color: '#4af', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '20px' }}>
                    <Label text="闪电增伤" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.increasedLightningDamage + '%'} style={{ fontSize: '14px', color: '#ff0', fontWeight: 'bold' }} />
                </Panel>
                
                {/* 增幅乘区汇总 */}
                <Panel style={{ backgroundColor: '#1a2a1a', padding: '10px', flowChildren: 'right', border: '1px solid #0f0' }}>
                    <Label text="增幅乘区" style={{ fontSize: '14px', color: '#888', width: '100px' }} />
                    <Label text={'x' + increasedMultiplier.toFixed(3)} style={{ fontSize: '18px', color: '#0f0', fontWeight: 'bold' }} />
                </Panel>
            </Panel>

            {/* 中列 - 额外伤害 + 暴击 */}
            <Panel style={{ width: '280px', height: '100%', backgroundColor: '#0a0a0a', border: '2px solid #333', padding: '15px', flowChildren: 'down', marginRight: '15px' }}>
                <Label text="额外伤害 (More)" style={{ fontSize: '16px', color: '#f80', fontWeight: 'bold', marginBottom: '5px' }} />
                <Panel style={{ width: '100%', height: '2px', backgroundColor: '#f80', opacity: '0.5', marginBottom: '10px' }} />
                <Label text="独立乘法叠加 (珍贵)" style={{ fontSize: '10px', color: '#666', marginBottom: '15px' }} />
                
                {moreArr.length > 0 ?   (
                    <Panel style={{ flowChildren: 'down', marginBottom: '15px' }}>
                        {moreArr.map((v, i) => (
                            <Panel key={i} style={{ flowChildren: 'right', width: '100%', marginBottom: '6px' }}>
                                <Label text={'额外伤害 #' + (i + 1)} style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                                <Label text={(v || 0) + '%'} style={{ fontSize: '14px', color: '#f80', fontWeight: 'bold' }} />
                            </Panel>
                        ))}
                    </Panel>
                ) : (
                    <Label text="无额外伤害来源" style={{ fontSize: '12px', color: '#555', marginBottom: '15px' }} />
                )}
                
                {/* 额外乘区汇总 */}
                <Panel style={{ backgroundColor: '#2a1a0a', padding: '10px', flowChildren: 'right', border: '1px solid #f80', marginBottom: '25px' }}>
                    <Label text="额外乘区" style={{ fontSize: '14px', color: '#888', width: '100px' }} />
                    <Label text={'x' + moreMultiplier.toFixed(3)} style={{ fontSize: '18px', color: '#f80', fontWeight: 'bold' }} />
                </Panel>

                {/* 暴击区域 */}
                <Label text="暴击" style={{ fontSize: '16px', color: '#f0a', fontWeight: 'bold', marginBottom: '5px', marginTop: '10px' }} />
                <Panel style={{ width: '100%', height: '2px', backgroundColor: '#f0a', opacity: '0.5', marginBottom: '15px' }} />
                
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="暴击率" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={critChance + '%'} style={{ fontSize: '14px', color: critChance > 5 ? '#f0a' : '#fff', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '20px' }}>
                    <Label text="暴击伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={critMultiplier + '%'} style={{ fontSize: '14px', color: critMultiplier > 150 ? '#f0a' : '#fff', fontWeight: 'bold' }} />
                </Panel>
                
                {/* 暴击乘区汇总 */}
                <Panel style={{ backgroundColor: '#2a1a2a', padding: '10px', flowChildren: 'right', border: '1px solid #f0a' }}>
                    <Label text="暴击乘区(期望)" style={{ fontSize: '14px', color: '#888', width: '100px' }} />
                    <Label text={'x' + critExpected.toFixed(3)} style={{ fontSize: '18px', color: '#f0a', fontWeight: 'bold' }} />
                </Panel>
            </Panel>

            {/* 右列 - 技能类型伤害 + 其他 */}
            <Panel style={{ width: '280px', height: '100%', backgroundColor: '#0a0a0a', border: '2px solid #333', padding: '15px', flowChildren: 'down' }}>
                <Label text="技能类型伤害" style={{ fontSize: '16px', color: '#0af', fontWeight: 'bold', marginBottom: '5px' }} />
                <Panel style={{ width: '100%', height: '2px', backgroundColor: '#0af', opacity: '0.5', marginBottom: '10px' }} />
                <Label text="按技能标签生效" style={{ fontSize: '10px', color: '#666', marginBottom: '15px' }} />
                
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="投射物伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.projectileDamage + '%'} style={{ fontSize: '14px', color: '#0af', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="范围伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.areaDamage + '%'} style={{ fontSize: '14px', color: '#0af', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="近战伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.meleeDamage + '%'} style={{ fontSize: '14px', color: '#0af', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="法术伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.spellDamage + '%'} style={{ fontSize: '14px', color: '#0af', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="攻击伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.attackDamage + '%'} style={{ fontSize: '14px', color: '#0af', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '25px' }}>
                    <Label text="持续伤害" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.dotDamage + '%'} style={{ fontSize: '14px', color: '#0af', fontWeight: 'bold' }} />
                </Panel>

                {/* 其他属性 */}
                <Label text="其他属性" style={{ fontSize: '16px', color: '#888', fontWeight: 'bold', marginBottom: '5px' }} />
                <Panel style={{ width: '100%', height: '2px', backgroundColor: '#888', opacity: '0.5', marginBottom: '15px' }} />
                
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="冷却缩减" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.cooldownReduction + '%'} style={{ fontSize: '14px', color: '#8af', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="范围扩大" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.areaOfEffect + '%'} style={{ fontSize: '14px', color: '#8af', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="攻击速度" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.attackSpeed + '%'} style={{ fontSize: '14px', color: '#8af', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="施法速度" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.castSpeed + '%'} style={{ fontSize: '14px', color: '#8af', fontWeight: 'bold' }} />
                </Panel>
                <Panel style={{ flowChildren: 'right', width: '100%', marginBottom: '8px' }}>
                    <Label text="生命偷取" style={{ fontSize: '14px', color: '#aaa', width: '120px' }} />
                    <Label text={charStats.lifesteal + '%'} style={{ fontSize: '14px', color: '#8f8', fontWeight: 'bold' }} />
                </Panel>
            </Panel>
        </Panel>
    );

    // ========== 主界面 ==========
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
                    <Label text={'装备: ' + equipCount + '/8'} style={{ fontSize: '14px', color: '#888', marginTop: '20px', marginRight: '20px' }} />
                </Panel>

                {/* 内容区域 */}
                <Panel style={{ width: '100%', height: '630px' }}>
                    {tab === 0 && <EquipmentTab />}
                    {tab === 1 && <DetailTab />}
                </Panel>

                {/* 底部按钮 */}
                <Panel style={{ width: '100%', height: '60px', backgroundColor: '#101010', borderTop: '2px solid #3a3020', flowChildren: 'right', horizontalAlign: 'center' }}>
                    <Panel hittest={true} onactivate={onClose} style={{ width: '100px', height: '34px', backgroundColor: '#1a1a1a', border: '2px solid #666', marginTop: '13px' }}>
                        <Label text="关闭(C)" style={{ fontSize: '12px', color: '#ccc', horizontalAlign: 'center', marginTop: '8px' }} />
                    </Panel>
                </Panel>
            </Panel>
        </Panel>
    );
};