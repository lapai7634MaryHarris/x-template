/**
 * 伤害数值配置
 * POE风格乘区系统
 */

// ========== 乘区定义 ==========
// 最终伤害 = 基础伤害 × 增幅乘区 × 额外乘区 × 暴击乘区 × 技能类型乘区

export enum MultiplierType {
    // 乘区1：基础伤害（技能基础 + 等级成长）
    BASE = 'base',
    
    // 乘区2：增幅 Increased（加法叠加，常见）
    INCREASED = 'increased',
    
    // 乘区3：额外 More（乘法叠加，珍贵）
    MORE = 'more',
    
    // 乘区4：暴击（暴击率×暴击伤害）
    CRITICAL = 'critical',
    
    // 乘区5：技能类型（特定技能加成，加法叠加）
    SKILL_TYPE = 'skill_type',
}

// ========== 技能类型标签 ==========
export enum SkillTag {
    PROJECTILE = 'projectile',   // 投射物
    AREA = 'area',               // 范围/AOE
    MELEE = 'melee',             // 近战
    SPELL = 'spell',             // 法术
    ATTACK = 'attack',           // 攻击
    FIRE = 'fire',               // 火焰
    COLD = 'cold',               // 冰霜
    LIGHTNING = 'lightning',     // 闪电
    PHYSICAL = 'physical',       // 物理
    DOT = 'dot',                 // 持续伤害
}

// ========== 词条类型定义 ==========
export enum StatType {
    // === 乘区2：增幅类（Increased，加法叠加）===
    INCREASED_DAMAGE = 'increased_damage',               // 增加伤害%
    INCREASED_PHYSICAL_DAMAGE = 'increased_phys_damage', // 增加物理伤害%
    INCREASED_ELEMENTAL_DAMAGE = 'increased_ele_damage', // 增加元素伤害%
    INCREASED_FIRE_DAMAGE = 'increased_fire_damage',     // 增加火焰伤害%
    INCREASED_COLD_DAMAGE = 'increased_cold_damage',     // 增加冰霜伤害%
    INCREASED_LIGHTNING_DAMAGE = 'increased_light_damage', // 增加闪电伤害%
    
    // === 乘区3：额外类（More，乘法叠加，珍贵）===
    MORE_DAMAGE = 'more_damage',                         // 额外伤害%
    MORE_PHYSICAL_DAMAGE = 'more_phys_damage',           // 额外物理伤害%
    MORE_ELEMENTAL_DAMAGE = 'more_ele_damage',           // 额外元素伤害%
    
    // === 乘区4：暴击类 ===
    CRIT_CHANCE = 'crit_chance',                         // 暴击率%（珍贵）
    CRIT_MULTIPLIER = 'crit_multiplier',                 // 暴击伤害%
    
    // === 乘区5：技能类型增幅（加法叠加）===
    PROJECTILE_DAMAGE = 'projectile_damage',             // 投射物伤害%
    AREA_DAMAGE = 'area_damage',                         // 范围伤害%
    MELEE_DAMAGE = 'melee_damage',                       // 近战伤害%
    SPELL_DAMAGE = 'spell_damage',                       // 法术伤害%
    ATTACK_DAMAGE = 'attack_damage',                     // 攻击伤害%
    DOT_DAMAGE = 'dot_damage',                           // 持续伤害%
    
    // === 其他属性（非伤害）===
    COOLDOWN_REDUCTION = 'cooldown_reduction',           // 冷却缩减%
    AREA_OF_EFFECT = 'area_of_effect',                   // 范围扩大%
    PROJECTILE_SPEED = 'projectile_speed',               // 投射物速度%
    ATTACK_SPEED = 'attack_speed',                       // 攻击速度%
    CAST_SPEED = 'cast_speed',                           // 施法速度%
    LIFESTEAL = 'lifesteal',                             // 生命偷取%
    LIFE_ON_HIT = 'life_on_hit',                         // 击中回复生命
    MANA_COST_REDUCTION = 'mana_cost_reduction',         // 消耗降低%
}

// ========== 词条归属乘区映射 ==========
export const STAT_TO_MULTIPLIER: Record<StatType, MultiplierType> = {
    // 增幅类 → 乘区2
    [StatType.INCREASED_DAMAGE]: MultiplierType. INCREASED,
    [StatType. INCREASED_PHYSICAL_DAMAGE]: MultiplierType.INCREASED,
    [StatType. INCREASED_ELEMENTAL_DAMAGE]: MultiplierType.INCREASED,
    [StatType. INCREASED_FIRE_DAMAGE]: MultiplierType.INCREASED,
    [StatType.INCREASED_COLD_DAMAGE]: MultiplierType.INCREASED,
    [StatType.INCREASED_LIGHTNING_DAMAGE]: MultiplierType.INCREASED,
    
    // 额外类 → 乘区3
    [StatType.MORE_DAMAGE]: MultiplierType.MORE,
    [StatType.MORE_PHYSICAL_DAMAGE]: MultiplierType.MORE,
    [StatType.MORE_ELEMENTAL_DAMAGE]: MultiplierType.MORE,
    
    // 暴击类 → 乘区4
    [StatType.CRIT_CHANCE]: MultiplierType.CRITICAL,
    [StatType.CRIT_MULTIPLIER]: MultiplierType. CRITICAL,
    
    // 技能类型 → 乘区5
    [StatType.PROJECTILE_DAMAGE]: MultiplierType.SKILL_TYPE,
    [StatType.AREA_DAMAGE]: MultiplierType.SKILL_TYPE,
    [StatType. MELEE_DAMAGE]: MultiplierType.SKILL_TYPE,
    [StatType.SPELL_DAMAGE]: MultiplierType.SKILL_TYPE,
    [StatType.ATTACK_DAMAGE]: MultiplierType. SKILL_TYPE,
    [StatType.DOT_DAMAGE]: MultiplierType.SKILL_TYPE,
    
    // 其他（不参与伤害乘区）
    [StatType.COOLDOWN_REDUCTION]: MultiplierType.BASE,
    [StatType. AREA_OF_EFFECT]: MultiplierType.BASE,
    [StatType.PROJECTILE_SPEED]: MultiplierType. BASE,
    [StatType. ATTACK_SPEED]: MultiplierType.BASE,
    [StatType.CAST_SPEED]: MultiplierType.BASE,
    [StatType.LIFESTEAL]: MultiplierType. BASE,
    [StatType. LIFE_ON_HIT]: MultiplierType.BASE,
    [StatType.MANA_COST_REDUCTION]: MultiplierType.BASE,
};

// ========== 技能类型词条对应的标签 ==========
export const SKILL_TYPE_STAT_TO_TAG: Partial<Record<StatType, SkillTag>> = {
    [StatType.PROJECTILE_DAMAGE]: SkillTag. PROJECTILE,
    [StatType.AREA_DAMAGE]: SkillTag.AREA,
    [StatType.MELEE_DAMAGE]: SkillTag.MELEE,
    [StatType.SPELL_DAMAGE]: SkillTag. SPELL,
    [StatType. ATTACK_DAMAGE]: SkillTag.ATTACK,
    [StatType.DOT_DAMAGE]: SkillTag.DOT,
};

// ========== 词条中文名 ==========
export const STAT_NAMES: Record<StatType, string> = {
    [StatType.INCREASED_DAMAGE]: '增加伤害',
    [StatType.INCREASED_PHYSICAL_DAMAGE]: '增加物理伤害',
    [StatType.INCREASED_ELEMENTAL_DAMAGE]: '增加元素伤害',
    [StatType. INCREASED_FIRE_DAMAGE]: '增加火焰伤害',
    [StatType. INCREASED_COLD_DAMAGE]: '增加冰霜伤害',
    [StatType.INCREASED_LIGHTNING_DAMAGE]: '增加闪电伤害',
    
    [StatType.MORE_DAMAGE]: '额外伤害',
    [StatType.MORE_PHYSICAL_DAMAGE]: '额外物理伤害',
    [StatType.MORE_ELEMENTAL_DAMAGE]: '额外元素伤害',
    
    [StatType.CRIT_CHANCE]: '暴击率',
    [StatType. CRIT_MULTIPLIER]: '暴击伤害',
    
    [StatType. PROJECTILE_DAMAGE]: '投射物伤害',
    [StatType.AREA_DAMAGE]: '范围伤害',
    [StatType. MELEE_DAMAGE]: '近战伤害',
    [StatType.SPELL_DAMAGE]: '法术伤害',
    [StatType.ATTACK_DAMAGE]: '攻击伤害',
    [StatType.DOT_DAMAGE]: '持续伤害',
    
    [StatType. COOLDOWN_REDUCTION]: '冷却缩减',
    [StatType.AREA_OF_EFFECT]: '范围扩大',
    [StatType.PROJECTILE_SPEED]: '投射物速度',
    [StatType.ATTACK_SPEED]: '攻击速度',
    [StatType. CAST_SPEED]: '施法速度',
    [StatType.LIFESTEAL]: '生命偷取',
    [StatType.LIFE_ON_HIT]: '击中回血',
    [StatType. MANA_COST_REDUCTION]: '消耗降低',
};

// ========== 词条稀有度（影响出现概率和数值）==========
export enum StatRarity {
    COMMON = 1,      // 常见
    UNCOMMON = 2,    // 较少
    RARE = 3,        // 稀有
    VERY_RARE = 4,   // 非常稀有
}

export const STAT_RARITY: Record<StatType, StatRarity> = {
    // 常见
    [StatType.INCREASED_DAMAGE]: StatRarity. COMMON,
    [StatType. INCREASED_PHYSICAL_DAMAGE]: StatRarity.COMMON,
    [StatType.INCREASED_ELEMENTAL_DAMAGE]: StatRarity.COMMON,
    [StatType.CRIT_MULTIPLIER]: StatRarity.COMMON,
    [StatType.COOLDOWN_REDUCTION]: StatRarity.COMMON,
    [StatType.ATTACK_SPEED]: StatRarity.COMMON,
    [StatType.CAST_SPEED]: StatRarity. COMMON,
    
    // 较少
    [StatType. INCREASED_FIRE_DAMAGE]: StatRarity. UNCOMMON,
    [StatType. INCREASED_COLD_DAMAGE]: StatRarity.UNCOMMON,
    [StatType. INCREASED_LIGHTNING_DAMAGE]: StatRarity.UNCOMMON,
    [StatType. PROJECTILE_DAMAGE]: StatRarity.UNCOMMON,
    [StatType.AREA_DAMAGE]: StatRarity.UNCOMMON,
    [StatType. MELEE_DAMAGE]: StatRarity.UNCOMMON,
    [StatType.SPELL_DAMAGE]: StatRarity. UNCOMMON,
    [StatType.ATTACK_DAMAGE]: StatRarity.UNCOMMON,
    [StatType.DOT_DAMAGE]: StatRarity. UNCOMMON,
    [StatType.AREA_OF_EFFECT]: StatRarity.UNCOMMON,
    [StatType.PROJECTILE_SPEED]: StatRarity. UNCOMMON,
    [StatType.LIFESTEAL]: StatRarity. UNCOMMON,
    [StatType.LIFE_ON_HIT]: StatRarity.UNCOMMON,
    [StatType. MANA_COST_REDUCTION]: StatRarity.UNCOMMON,
    
    // 稀有
    [StatType.CRIT_CHANCE]: StatRarity. RARE,  // 暴击率稀有
    [StatType. MORE_ELEMENTAL_DAMAGE]: StatRarity.RARE,
    [StatType.MORE_PHYSICAL_DAMAGE]: StatRarity.RARE,
    
    // 非常稀有
    [StatType.MORE_DAMAGE]: StatRarity. VERY_RARE,  // 通用额外伤害非常稀有
};

// ========== 词条数值范围（按来源不同）==========
export interface StatValueRange {
    min: number;
    max: number;
}

// 护石词条数值范围
export const RUNE_STAT_VALUES: Partial<Record<StatType, StatValueRange>> = {
    // 增幅类（常见，数值较高）
    [StatType. INCREASED_DAMAGE]: { min: 5, max: 20 },
    [StatType. INCREASED_PHYSICAL_DAMAGE]: { min: 8, max: 25 },
    [StatType.INCREASED_ELEMENTAL_DAMAGE]: { min: 8, max: 25 },
    [StatType.INCREASED_FIRE_DAMAGE]: { min: 10, max: 30 },
    [StatType.INCREASED_COLD_DAMAGE]: { min: 10, max: 30 },
    [StatType. INCREASED_LIGHTNING_DAMAGE]: { min: 10, max: 30 },
    
    // 额外类（稀有，数值较低）
    [StatType. MORE_DAMAGE]: { min: 3, max: 10 },
    [StatType. MORE_PHYSICAL_DAMAGE]: { min: 5, max: 15 },
    [StatType.MORE_ELEMENTAL_DAMAGE]: { min: 5, max: 15 },
    
    // 暴击类
    [StatType.CRIT_CHANCE]: { min: 1, max: 5 },       // 暴击率珍贵，数值低
    [StatType.CRIT_MULTIPLIER]: { min: 10, max: 35 }, // 暴击伤害常见，数值高
    
    // 技能类型
    [StatType.PROJECTILE_DAMAGE]: { min: 8, max: 25 },
    [StatType.AREA_DAMAGE]: { min: 8, max: 25 },
    [StatType.MELEE_DAMAGE]: { min: 8, max: 25 },
    [StatType.SPELL_DAMAGE]: { min: 8, max: 25 },
    [StatType.ATTACK_DAMAGE]: { min: 8, max: 25 },
    [StatType.DOT_DAMAGE]: { min: 10, max: 30 },
    
    // 其他
    [StatType.COOLDOWN_REDUCTION]: { min: 3, max: 15 },
    [StatType.AREA_OF_EFFECT]: { min: 5, max: 20 },
    [StatType.LIFESTEAL]: { min: 1, max: 5 },
};

// 装备词条数值范围（比护石高）
export const EQUIPMENT_STAT_VALUES: Partial<Record<StatType, StatValueRange>> = {
    [StatType.INCREASED_DAMAGE]: { min: 10, max: 40 },
    [StatType.INCREASED_PHYSICAL_DAMAGE]: { min: 15, max: 50 },
    [StatType. INCREASED_ELEMENTAL_DAMAGE]: { min: 15, max: 50 },
    
    [StatType.MORE_DAMAGE]: { min: 5, max: 15 },
    
    [StatType.CRIT_CHANCE]: { min: 2, max: 8 },
    [StatType.CRIT_MULTIPLIER]: { min: 15, max: 50 },
    
    [StatType.PROJECTILE_DAMAGE]: { min: 15, max: 40 },
    [StatType. AREA_DAMAGE]: { min: 15, max: 40 },
    [StatType.MELEE_DAMAGE]: { min: 15, max: 40 },
    // ...  其他
};

// 天赋词条数值范围（固定值，不随机）
export const TALENT_STAT_VALUES: Partial<Record<StatType, number[]>> = {
    // 小天赋 [1级, 2级, 3级]
    [StatType.INCREASED_DAMAGE]: [3, 6, 10],
    [StatType.CRIT_MULTIPLIER]: [5, 10, 15],
    
    // 大天赋（单点）
    [StatType.MORE_DAMAGE]: [10],  // 大天赋给10%额外伤害
    [StatType.CRIT_CHANCE]: [3],   // 大天赋给3%暴击率
};

// ========== 技能配置 ==========
export interface SkillConfig {
    id: string;
    name: string;
    icon: string;
    tags: SkillTag[];           // 技能标签（决定哪些类型词条生效）
    baseDamage: number;         // 基础伤害
    damagePerLevel: number;     // 每级增加的基础伤害
    baseCooldown: number;       // 基础冷却
    cooldownPerLevel: number;   // 每级减少的冷却
    baseRange: number;          // 基础范围
    baseCritChance: number;     // 技能基础暴击率（有些技能自带高暴击）
    description: string;
}

export const SKILL_CONFIG: Record<string, SkillConfig> = {
    'warrior_thunder_strike': {
        id: 'warrior_thunder_strike',
        name: '雷霆一击',
        icon: 'sven_storm_bolt',
        tags: [SkillTag.AREA, SkillTag.LIGHTNING, SkillTag.SPELL],
        baseDamage: 100,
        damagePerLevel: 25,
        baseCooldown: 12,
        cooldownPerLevel: 0.5,
        baseRange: 600,
        baseCritChance: 0,
        description: '释放雷霆对区域内敌人造成闪电伤害',
    },
    'warrior_execute': {
        id: 'warrior_execute',
        name: '斩杀',
        icon: 'axe_culling_blade',
        tags: [SkillTag.MELEE, SkillTag.PHYSICAL, SkillTag.ATTACK],
        baseDamage: 300,
        damagePerLevel: 50,
        baseCooldown: 45,
        cooldownPerLevel: 2,
        baseRange: 150,
        baseCritChance: 10,  // 斩杀自带10%暴击
        description: '对低血量敌人造成巨额物理伤害',
    },
    'warrior_deep_wound': {
        id: 'warrior_deep_wound',
        name: '重伤',
        icon: 'bloodseeker_rupture',
        tags: [SkillTag.PHYSICAL, SkillTag.DOT, SkillTag. ATTACK],
        baseDamage: 30,
        damagePerLevel: 10,
        baseCooldown: 0,
        cooldownPerLevel: 0,
        baseRange: 0,
        baseCritChance: 0,
        description: '暴击时使敌人流血，持续造成物理伤害',
    },
    'warrior_charge': {
        id: 'warrior_charge',
        name: '冲锋',
        icon: 'spirit_breaker_charge_of_darkness',
        tags: [SkillTag.MELEE, SkillTag.PHYSICAL, SkillTag.ATTACK],
        baseDamage: 80,
        damagePerLevel: 20,
        baseCooldown: 14,
        cooldownPerLevel: 0.5,
        baseRange: 800,
        baseCritChance: 5,
        description: '向目标冲锋并造成物理伤害',
    },
    // ...  添加更多技能
};

// ========== 暴击系统配置 ==========
export const CRIT_CONFIG = {
    baseCritChance: 5,           // 全局基础暴击率
    baseCritMultiplier: 150,     // 全局基础暴击伤害
    maxCritChance: 100,          // 暴击率上限
    maxCritMultiplier: 1000,     // 暴击伤害上限
};

// ========== 品质配置 ==========
export enum ItemQuality {
    NORMAL = 1,      // 白
    MAGIC = 2,       // 绿
    RARE = 3,        // 蓝
    EPIC = 4,        // 紫
    LEGENDARY = 5,   // 橙
}

export const QUALITY_CONFIG = {
    names: {
        [ItemQuality.NORMAL]: '普通',
        [ItemQuality. MAGIC]: '魔法',
        [ItemQuality.RARE]: '稀有',
        [ItemQuality.EPIC]: '史诗',
        [ItemQuality.LEGENDARY]: '传说',
    },
    colors: {
        [ItemQuality. NORMAL]: '#ffffff',
        [ItemQuality. MAGIC]: '#00ff00',
        [ItemQuality.RARE]: '#0088ff',
        [ItemQuality.EPIC]: '#aa00ff',
        [ItemQuality.LEGENDARY]: '#ff8800',
    },
    // 品质对数值的乘数
    valueMultiplier: {
        [ItemQuality. NORMAL]: 0.6,
        [ItemQuality. MAGIC]: 0.8,
        [ItemQuality. RARE]: 1.0,
        [ItemQuality. EPIC]: 1.2,
        [ItemQuality. LEGENDARY]: 1.5,
    },
    // 品质对词条数量的影响（装备）
    affixCount: {
        [ItemQuality.NORMAL]: { min: 1, max: 1 },
        [ItemQuality.MAGIC]: { min: 1, max: 2 },
        [ItemQuality. RARE]: { min: 2, max: 3 },
        [ItemQuality.EPIC]: { min: 3, max: 4 },
        [ItemQuality.LEGENDARY]: { min: 4, max: 5 },
    },
};

// ========== 经济系统 ==========
export const ECONOMY_CONFIG = {
    // 护石分解
    runeDecompose: {
        [ItemQuality.NORMAL]: { material: 'material_common', count: 2 },
        [ItemQuality.MAGIC]: { material: 'material_common', count: 5 },
        [ItemQuality.RARE]: { material: 'material_fine', count: 3 },
        [ItemQuality.EPIC]: { material: 'material_rare', count: 2 },
        [ItemQuality.LEGENDARY]: { material: 'material_legendary', count: 1 },
    },
    // 护石槽位解锁
    runeSlotUnlock: {
        3: { material: 'material_rare', count: 10 },
        4: { material: 'material_legendary', count: 5 },
    },
};