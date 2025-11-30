/**
 * POE2风格装备系统 - 配置文件
 */

// ========== 品质等级 ==========
export enum ItemRarity {
    NORMAL = 1,     // 普通 - 白色
    MAGIC = 2,      // 魔法 - 蓝色
    RARE = 3,       // 稀有 - 黄色
    LEGENDARY = 4,  // 传说 - 橙色
}

export const RARITY_NAMES: Record<ItemRarity, string> = {
    [ItemRarity. NORMAL]: '普通',
    [ItemRarity.MAGIC]: '魔法',
    [ItemRarity.RARE]: '稀有',
    [ItemRarity.LEGENDARY]: '传说',
};

export const RARITY_COLORS: Record<ItemRarity, string> = {
    [ItemRarity. NORMAL]: '#c8c8c8',
    [ItemRarity.MAGIC]: '#8888ff',
    [ItemRarity.RARE]: '#ffff77',
    [ItemRarity. LEGENDARY]: '#ff8800',
};

// 词缀数量限制
export const RARITY_AFFIX_LIMIT: Record<ItemRarity, { maxPrefix: number; maxSuffix: number }> = {
    [ItemRarity.NORMAL]: { maxPrefix: 0, maxSuffix: 0 },
    [ItemRarity.MAGIC]: { maxPrefix: 1, maxSuffix: 1 },
    [ItemRarity.RARE]: { maxPrefix: 3, maxSuffix: 3 },
    [ItemRarity.LEGENDARY]: { maxPrefix: 3, maxSuffix: 3 },
};

// ========== 装备槽位 ==========
export enum EquipSlot {
    WEAPON = 'weapon',
    HELMET = 'helmet',
    ARMOR = 'armor',
    GLOVES = 'gloves',
    BOOTS = 'boots',
    BELT = 'belt',
    RING1 = 'ring1',
    RING2 = 'ring2',
    AMULET = 'amulet',
}

export const SLOT_NAMES: Record<EquipSlot, string> = {
    [EquipSlot.WEAPON]: '武器',
    [EquipSlot.HELMET]: '头盔',
    [EquipSlot.ARMOR]: '护甲',
    [EquipSlot.GLOVES]: '手套',
    [EquipSlot. BOOTS]: '鞋子',
    [EquipSlot.BELT]: '腰带',
    [EquipSlot.RING1]: '戒指',
    [EquipSlot.RING2]: '戒指',
    [EquipSlot.AMULET]: '项链',
};

// ========== 通货类型 ==========
export enum CurrencyType {
    EXALTED = 'exalted',    // 崇高石 - 增加1条词缀
    CHAOS = 'chaos',        // 混沌石 - 重随所有词缀
    DIVINE = 'divine',      // 神圣石 - 重随数值(词条不变)
}

export const CURRENCY_NAMES: Record<CurrencyType, string> = {
    [CurrencyType.EXALTED]: '崇高石',
    [CurrencyType. CHAOS]: '混沌石',
    [CurrencyType. DIVINE]: '神圣石',
};

export const CURRENCY_DESCRIPTIONS: Record<CurrencyType, string> = {
    [CurrencyType.EXALTED]: '为稀有物品增加一条随机词缀',
    [CurrencyType.CHAOS]: '重新随机稀有物品的所有词缀',
    [CurrencyType.DIVINE]: '重新随机物品词缀的数值范围',
};

export const CURRENCY_ICONS: Record<CurrencyType, string> = {
    [CurrencyType.EXALTED]: 'item_ultimate_orb',
    [CurrencyType.CHAOS]: 'item_octarine_core',
    [CurrencyType.DIVINE]: 'item_refresher',
};

// ========== 词缀位置 ==========
export enum AffixPosition {
    PREFIX = 'prefix',
    SUFFIX = 'suffix',
}

// ========== 词缀类型 ==========
export enum AffixType {
    // === 前缀 PREFIX ===
    // 基础属性 (固定值)
    FLAT_STRENGTH = 'flat_strength',
    FLAT_AGILITY = 'flat_agility',
    FLAT_INTELLIGENCE = 'flat_intelligence',
    FLAT_HEALTH = 'flat_health',
    FLAT_MANA = 'flat_mana',
    FLAT_ARMOR = 'flat_armor',
    FLAT_ATTACK_DAMAGE = 'flat_attack_damage',

    // 增幅伤害 (Increased) - 百分比，加法叠加
    INCREASED_PHYSICAL_DAMAGE = 'inc_physical_damage',
    INCREASED_ELEMENTAL_DAMAGE = 'inc_elemental_damage',
    INCREASED_FIRE_DAMAGE = 'inc_fire_damage',
    INCREASED_COLD_DAMAGE = 'inc_cold_damage',
    INCREASED_LIGHTNING_DAMAGE = 'inc_lightning_damage',

    // 额外伤害 (More) - 百分比，乘法叠加，极稀有
    MORE_DAMAGE = 'more_damage',
    MORE_PHYSICAL_DAMAGE = 'more_physical_damage',
    MORE_ELEMENTAL_DAMAGE = 'more_elemental_damage',

    // === 后缀 SUFFIX ===
    // 攻击
    INCREASED_ATTACK_SPEED = 'inc_attack_speed',
    CRIT_CHANCE = 'crit_chance',
    CRIT_MULTIPLIER = 'crit_multiplier',

    // 防御 - 抗性
    FIRE_RESISTANCE = 'fire_resistance',
    COLD_RESISTANCE = 'cold_resistance',
    LIGHTNING_RESISTANCE = 'lightning_resistance',
    ALL_RESISTANCE = 'all_resistance',

    // 实用
    COOLDOWN_REDUCTION = 'cooldown_reduction',
    LIFE_LEECH = 'life_leech',
    MOVE_SPEED = 'move_speed',
    LIFE_REGEN = 'life_regen',
    LIFE_ON_KILL = 'life_on_kill',
    MANA_ON_KILL = 'mana_on_kill',
}

// ========== 词缀层级定义 ==========
export interface AffixTier {
    tier: number;           // T1最好, T5最差
    minValue: number;
    maxValue: number;
    requiredItemLevel: number;
    weight: number;         // 出现权重，越高越常见
}

// ========== 词缀定义 ==========
export interface AffixDefinition {
    id: AffixType;
    name: string;
    description: string;    // 显示格式，如 "+{value} 力量"
    position: AffixPosition;
    isPercent: boolean;     // 是否百分比
    tiers: AffixTier[];
    allowedSlots: EquipSlot[];  // 允许出现的槽位，空数组表示所有槽位
    tags: string[];         // 标签，用于互斥判断
}

// ========== 词缀池 ==========
export const AFFIX_POOL: AffixDefinition[] = [
    // ==================== 前缀 ====================
    // 力量
    {
        id: AffixType. FLAT_STRENGTH,
        name: '力量',
        description: '+{value} 力量',
        position: AffixPosition.PREFIX,
        isPercent: false,
        tiers: [
            { tier: 1, minValue: 25, maxValue: 30, requiredItemLevel: 60, weight: 100 },
            { tier: 2, minValue: 18, maxValue: 24, requiredItemLevel: 45, weight: 200 },
            { tier: 3, minValue: 12, maxValue: 17, requiredItemLevel: 30, weight: 400 },
            { tier: 4, minValue: 6, maxValue: 11, requiredItemLevel: 15, weight: 600 },
            { tier: 5, minValue: 1, maxValue: 5, requiredItemLevel: 1, weight: 800 },
        ],
        allowedSlots: [],
        tags: ['attribute'],
    },
    // 敏捷
    {
        id: AffixType. FLAT_AGILITY,
        name: '敏捷',
        description: '+{value} 敏捷',
        position: AffixPosition.PREFIX,
        isPercent: false,
        tiers: [
            { tier: 1, minValue: 25, maxValue: 30, requiredItemLevel: 60, weight: 100 },
            { tier: 2, minValue: 18, maxValue: 24, requiredItemLevel: 45, weight: 200 },
            { tier: 3, minValue: 12, maxValue: 17, requiredItemLevel: 30, weight: 400 },
            { tier: 4, minValue: 6, maxValue: 11, requiredItemLevel: 15, weight: 600 },
            { tier: 5, minValue: 1, maxValue: 5, requiredItemLevel: 1, weight: 800 },
        ],
        allowedSlots: [],
        tags: ['attribute'],
    },
    // 智力
    {
        id: AffixType. FLAT_INTELLIGENCE,
        name: '智力',
        description: '+{value} 智力',
        position: AffixPosition.PREFIX,
        isPercent: false,
        tiers: [
            { tier: 1, minValue: 25, maxValue: 30, requiredItemLevel: 60, weight: 100 },
            { tier: 2, minValue: 18, maxValue: 24, requiredItemLevel: 45, weight: 200 },
            { tier: 3, minValue: 12, maxValue: 17, requiredItemLevel: 30, weight: 400 },
            { tier: 4, minValue: 6, maxValue: 11, requiredItemLevel: 15, weight: 600 },
            { tier: 5, minValue: 1, maxValue: 5, requiredItemLevel: 1, weight: 800 },
        ],
        allowedSlots: [],
        tags: ['attribute'],
    },
    // 生命
    {
        id: AffixType.FLAT_HEALTH,
        name: '生命',
        description: '+{value} 最大生命',
        position: AffixPosition.PREFIX,
        isPercent: false,
        tiers: [
            { tier: 1, minValue: 90, maxValue: 120, requiredItemLevel: 60, weight: 100 },
            { tier: 2, minValue: 60, maxValue: 89, requiredItemLevel: 45, weight: 200 },
            { tier: 3, minValue: 40, maxValue: 59, requiredItemLevel: 30, weight: 400 },
            { tier: 4, minValue: 20, maxValue: 39, requiredItemLevel: 15, weight: 600 },
            { tier: 5, minValue: 5, maxValue: 19, requiredItemLevel: 1, weight: 800 },
        ],
        allowedSlots: [],
        tags: ['life', 'defence'],
    },
    // 魔法
    {
        id: AffixType.FLAT_MANA,
        name: '魔法',
        description: '+{value} 最大魔法',
        position: AffixPosition.PREFIX,
        isPercent: false,
        tiers: [
            { tier: 1, minValue: 70, maxValue: 90, requiredItemLevel: 60, weight: 100 },
            { tier: 2, minValue: 50, maxValue: 69, requiredItemLevel: 45, weight: 200 },
            { tier: 3, minValue: 30, maxValue: 49, requiredItemLevel: 30, weight: 400 },
            { tier: 4, minValue: 15, maxValue: 29, requiredItemLevel: 15, weight: 600 },
            { tier: 5, minValue: 5, maxValue: 14, requiredItemLevel: 1, weight: 800 },
        ],
        allowedSlots: [],
        tags: ['mana', 'defence'],
    },
    // 护甲
    {
        id: AffixType.FLAT_ARMOR,
        name: '护甲',
        description: '+{value} 护甲',
        position: AffixPosition.PREFIX,
        isPercent: false,
        tiers: [
            { tier: 1, minValue: 15, maxValue: 20, requiredItemLevel: 60, weight: 100 },
            { tier: 2, minValue: 10, maxValue: 14, requiredItemLevel: 45, weight: 200 },
            { tier: 3, minValue: 6, maxValue: 9, requiredItemLevel: 30, weight: 400 },
            { tier: 4, minValue: 3, maxValue: 5, requiredItemLevel: 15, weight: 600 },
            { tier: 5, minValue: 1, maxValue: 2, requiredItemLevel: 1, weight: 800 },
        ],
        allowedSlots: [EquipSlot.ARMOR, EquipSlot.HELMET, EquipSlot.GLOVES, EquipSlot. BOOTS, EquipSlot.BELT],
        tags: ['armour', 'defence'],
    },
    // 攻击力
    {
        id: AffixType.FLAT_ATTACK_DAMAGE,
        name: '攻击力',
        description: '+{value} 攻击力',
        position: AffixPosition.PREFIX,
        isPercent: false,
        tiers: [
            { tier: 1, minValue: 30, maxValue: 45, requiredItemLevel: 60, weight: 100 },
            { tier: 2, minValue: 20, maxValue: 29, requiredItemLevel: 45, weight: 200 },
            { tier: 3, minValue: 12, maxValue: 19, requiredItemLevel: 30, weight: 400 },
            { tier: 4, minValue: 6, maxValue: 11, requiredItemLevel: 15, weight: 600 },
            { tier: 5, minValue: 1, maxValue: 5, requiredItemLevel: 1, weight: 800 },
        ],
        allowedSlots: [EquipSlot.WEAPON, EquipSlot. RING1, EquipSlot. RING2, EquipSlot.AMULET],
        tags: ['damage', 'attack'],
    },
    // 物理伤害增幅
    {
        id: AffixType.INCREASED_PHYSICAL_DAMAGE,
        name: '物理伤害增幅',
        description: '+{value}% 物理伤害',
        position: AffixPosition.PREFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 35, maxValue: 50, requiredItemLevel: 60, weight: 80 },
            { tier: 2, minValue: 25, maxValue: 34, requiredItemLevel: 45, weight: 150 },
            { tier: 3, minValue: 15, maxValue: 24, requiredItemLevel: 30, weight: 300 },
            { tier: 4, minValue: 8, maxValue: 14, requiredItemLevel: 15, weight: 500 },
            { tier: 5, minValue: 3, maxValue: 7, requiredItemLevel: 1, weight: 700 },
        ],
        allowedSlots: [EquipSlot.WEAPON, EquipSlot. RING1, EquipSlot.RING2, EquipSlot.AMULET],
        tags: ['damage', 'physical', 'increased'],
    },
    // 元素伤害增幅
    {
        id: AffixType.INCREASED_ELEMENTAL_DAMAGE,
        name: '元素伤害增幅',
        description: '+{value}% 元素伤害',
        position: AffixPosition.PREFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 30, maxValue: 40, requiredItemLevel: 60, weight: 80 },
            { tier: 2, minValue: 20, maxValue: 29, requiredItemLevel: 45, weight: 150 },
            { tier: 3, minValue: 12, maxValue: 19, requiredItemLevel: 30, weight: 300 },
            { tier: 4, minValue: 6, maxValue: 11, requiredItemLevel: 15, weight: 500 },
            { tier: 5, minValue: 2, maxValue: 5, requiredItemLevel: 1, weight: 700 },
        ],
        allowedSlots: [EquipSlot.WEAPON, EquipSlot. RING1, EquipSlot.RING2, EquipSlot.AMULET],
        tags: ['damage', 'elemental', 'increased'],
    },
    // 火焰伤害增幅
    {
        id: AffixType.INCREASED_FIRE_DAMAGE,
        name: '火焰伤害增幅',
        description: '+{value}% 火焰伤害',
        position: AffixPosition.PREFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 40, maxValue: 55, requiredItemLevel: 60, weight: 60 },
            { tier: 2, minValue: 28, maxValue: 39, requiredItemLevel: 45, weight: 120 },
            { tier: 3, minValue: 18, maxValue: 27, requiredItemLevel: 30, weight: 250 },
            { tier: 4, minValue: 10, maxValue: 17, requiredItemLevel: 15, weight: 400 },
            { tier: 5, minValue: 4, maxValue: 9, requiredItemLevel: 1, weight: 600 },
        ],
        allowedSlots: [],
        tags: ['damage', 'fire', 'increased'],
    },
    // 冰霜伤害增幅
    {
        id: AffixType.INCREASED_COLD_DAMAGE,
        name: '冰霜伤害增幅',
        description: '+{value}% 冰霜伤害',
        position: AffixPosition.PREFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 40, maxValue: 55, requiredItemLevel: 60, weight: 60 },
            { tier: 2, minValue: 28, maxValue: 39, requiredItemLevel: 45, weight: 120 },
            { tier: 3, minValue: 18, maxValue: 27, requiredItemLevel: 30, weight: 250 },
            { tier: 4, minValue: 10, maxValue: 17, requiredItemLevel: 15, weight: 400 },
            { tier: 5, minValue: 4, maxValue: 9, requiredItemLevel: 1, weight: 600 },
        ],
        allowedSlots: [],
        tags: ['damage', 'cold', 'increased'],
    },
    // 闪电伤害增幅
    {
        id: AffixType.INCREASED_LIGHTNING_DAMAGE,
        name: '闪电伤害增幅',
        description: '+{value}% 闪电伤害',
        position: AffixPosition.PREFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 40, maxValue: 55, requiredItemLevel: 60, weight: 60 },
            { tier: 2, minValue: 28, maxValue: 39, requiredItemLevel: 45, weight: 120 },
            { tier: 3, minValue: 18, maxValue: 27, requiredItemLevel: 30, weight: 250 },
            { tier: 4, minValue: 10, maxValue: 17, requiredItemLevel: 15, weight: 400 },
            { tier: 5, minValue: 4, maxValue: 9, requiredItemLevel: 1, weight: 600 },
        ],
        allowedSlots: [],
        tags: ['damage', 'lightning', 'increased'],
    },
    // ⭐ 额外伤害 (More) - 极稀有
    {
        id: AffixType.MORE_DAMAGE,
        name: '额外伤害',
        description: '+{value}% 额外伤害 (乘算)',
        position: AffixPosition.PREFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 8, maxValue: 12, requiredItemLevel: 70, weight: 5 },
            { tier: 2, minValue: 5, maxValue: 7, requiredItemLevel: 55, weight: 10 },
            { tier: 3, minValue: 3, maxValue: 4, requiredItemLevel: 40, weight: 20 },
        ],
        allowedSlots: [EquipSlot.WEAPON, EquipSlot. AMULET],
        tags: ['damage', 'more'],
    },

    // ==================== 后缀 ====================
    // 攻击速度
    {
        id: AffixType. INCREASED_ATTACK_SPEED,
        name: '攻击速度',
        description: '+{value}% 攻击速度',
        position: AffixPosition.SUFFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 12, maxValue: 15, requiredItemLevel: 60, weight: 80 },
            { tier: 2, minValue: 8, maxValue: 11, requiredItemLevel: 45, weight: 150 },
            { tier: 3, minValue: 5, maxValue: 7, requiredItemLevel: 30, weight: 300 },
            { tier: 4, minValue: 3, maxValue: 4, requiredItemLevel: 15, weight: 500 },
            { tier: 5, minValue: 1, maxValue: 2, requiredItemLevel: 1, weight: 700 },
        ],
        allowedSlots: [EquipSlot.WEAPON, EquipSlot.GLOVES, EquipSlot. RING1, EquipSlot. RING2],
        tags: ['attack', 'speed'],
    },
    // 暴击率
    {
        id: AffixType. CRIT_CHANCE,
        name: '暴击率',
        description: '+{value}% 暴击率',
        position: AffixPosition.SUFFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 35, maxValue: 45, requiredItemLevel: 60, weight: 80 },
            { tier: 2, minValue: 25, maxValue: 34, requiredItemLevel: 45, weight: 150 },
            { tier: 3, minValue: 15, maxValue: 24, requiredItemLevel: 30, weight: 300 },
            { tier: 4, minValue: 8, maxValue: 14, requiredItemLevel: 15, weight: 500 },
            { tier: 5, minValue: 3, maxValue: 7, requiredItemLevel: 1, weight: 700 },
        ],
        allowedSlots: [EquipSlot. WEAPON, EquipSlot.RING1, EquipSlot. RING2, EquipSlot.AMULET],
        tags: ['crit', 'attack'],
    },
    // 暴击伤害
    {
        id: AffixType.CRIT_MULTIPLIER,
        name: '暴击伤害',
        description: '+{value}% 暴击伤害',
        position: AffixPosition. SUFFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 40, maxValue: 55, requiredItemLevel: 60, weight: 80 },
            { tier: 2, minValue: 28, maxValue: 39, requiredItemLevel: 45, weight: 150 },
            { tier: 3, minValue: 18, maxValue: 27, requiredItemLevel: 30, weight: 300 },
            { tier: 4, minValue: 10, maxValue: 17, requiredItemLevel: 15, weight: 500 },
            { tier: 5, minValue: 5, maxValue: 9, requiredItemLevel: 1, weight: 700 },
        ],
        allowedSlots: [EquipSlot.WEAPON, EquipSlot. RING1, EquipSlot.RING2, EquipSlot.AMULET],
        tags: ['crit', 'attack'],
    },
    // 火焰抗性
    {
        id: AffixType.FIRE_RESISTANCE,
        name: '火焰抗性',
        description: '+{value}% 火焰抗性',
        position: AffixPosition.SUFFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 36, maxValue: 45, requiredItemLevel: 60, weight: 100 },
            { tier: 2, minValue: 26, maxValue: 35, requiredItemLevel: 45, weight: 200 },
            { tier: 3, minValue: 16, maxValue: 25, requiredItemLevel: 30, weight: 400 },
            { tier: 4, minValue: 8, maxValue: 15, requiredItemLevel: 15, weight: 600 },
            { tier: 5, minValue: 3, maxValue: 7, requiredItemLevel: 1, weight: 800 },
        ],
        allowedSlots: [],
        tags: ['resistance', 'fire'],
    },
    // 冰霜抗性
    {
        id: AffixType. COLD_RESISTANCE,
        name: '冰霜抗性',
        description: '+{value}% 冰霜抗性',
        position: AffixPosition.SUFFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 36, maxValue: 45, requiredItemLevel: 60, weight: 100 },
            { tier: 2, minValue: 26, maxValue: 35, requiredItemLevel: 45, weight: 200 },
            { tier: 3, minValue: 16, maxValue: 25, requiredItemLevel: 30, weight: 400 },
            { tier: 4, minValue: 8, maxValue: 15, requiredItemLevel: 15, weight: 600 },
            { tier: 5, minValue: 3, maxValue: 7, requiredItemLevel: 1, weight: 800 },
        ],
        allowedSlots: [],
        tags: ['resistance', 'cold'],
    },
    // 闪电抗性
    {
        id: AffixType.LIGHTNING_RESISTANCE,
        name: '闪电抗性',
        description: '+{value}% 闪电抗性',
        position: AffixPosition.SUFFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 36, maxValue: 45, requiredItemLevel: 60, weight: 100 },
            { tier: 2, minValue: 26, maxValue: 35, requiredItemLevel: 45, weight: 200 },
            { tier: 3, minValue: 16, maxValue: 25, requiredItemLevel: 30, weight: 400 },
            { tier: 4, minValue: 8, maxValue: 15, requiredItemLevel: 15, weight: 600 },
            { tier: 5, minValue: 3, maxValue: 7, requiredItemLevel: 1, weight: 800 },
        ],
        allowedSlots: [],
        tags: ['resistance', 'lightning'],
    },
    // 全抗性
    {
        id: AffixType.ALL_RESISTANCE,
        name: '全抗性',
        description: '+{value}% 全部抗性',
        position: AffixPosition.SUFFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 15, maxValue: 20, requiredItemLevel: 60, weight: 30 },
            { tier: 2, minValue: 10, maxValue: 14, requiredItemLevel: 45, weight: 60 },
            { tier: 3, minValue: 6, maxValue: 9, requiredItemLevel: 30, weight: 120 },
            { tier: 4, minValue: 3, maxValue: 5, requiredItemLevel: 15, weight: 200 },
        ],
        allowedSlots: [],
        tags: ['resistance', 'all'],
    },
    // 冷却缩减
    {
        id: AffixType.COOLDOWN_REDUCTION,
        name: '冷却缩减',
        description: '+{value}% 冷却缩减',
        position: AffixPosition.SUFFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 12, maxValue: 15, requiredItemLevel: 60, weight: 60 },
            { tier: 2, minValue: 8, maxValue: 11, requiredItemLevel: 45, weight: 120 },
            { tier: 3, minValue: 5, maxValue: 7, requiredItemLevel: 30, weight: 250 },
            { tier: 4, minValue: 2, maxValue: 4, requiredItemLevel: 15, weight: 400 },
        ],
        allowedSlots: [EquipSlot.HELMET, EquipSlot. BELT, EquipSlot. AMULET],
        tags: ['utility', 'cooldown'],
    },
    // 生命偷取
    {
        id: AffixType.LIFE_LEECH,
        name: '生命偷取',
        description: '+{value}% 生命偷取',
        position: AffixPosition.SUFFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 4, maxValue: 6, requiredItemLevel: 60, weight: 60 },
            { tier: 2, minValue: 3, maxValue: 3, requiredItemLevel: 45, weight: 120 },
            { tier: 3, minValue: 2, maxValue: 2, requiredItemLevel: 30, weight: 250 },
            { tier: 4, minValue: 1, maxValue: 1, requiredItemLevel: 15, weight: 400 },
        ],
        allowedSlots: [EquipSlot.WEAPON, EquipSlot. RING1, EquipSlot. RING2, EquipSlot.AMULET, EquipSlot.GLOVES],
        tags: ['life', 'leech'],
    },
    // 移动速度
    {
        id: AffixType.MOVE_SPEED,
        name: '移动速度',
        description: '+{value}% 移动速度',
        position: AffixPosition.SUFFIX,
        isPercent: true,
        tiers: [
            { tier: 1, minValue: 28, maxValue: 35, requiredItemLevel: 60, weight: 50 },
            { tier: 2, minValue: 20, maxValue: 27, requiredItemLevel: 45, weight: 100 },
            { tier: 3, minValue: 12, maxValue: 19, requiredItemLevel: 30, weight: 200 },
            { tier: 4, minValue: 5, maxValue: 11, requiredItemLevel: 15, weight: 400 },
        ],
        allowedSlots: [EquipSlot. BOOTS],
        tags: ['movement', 'speed'],
    },
    // 生命回复
    {
        id: AffixType. LIFE_REGEN,
        name: '生命回复',
        description: '+{value} 生命回复/秒',
        position: AffixPosition.SUFFIX,
        isPercent: false,
        tiers: [
            { tier: 1, minValue: 15, maxValue: 20, requiredItemLevel: 60, weight: 100 },
            { tier: 2, minValue: 10, maxValue: 14, requiredItemLevel: 45, weight: 200 },
            { tier: 3, minValue: 6, maxValue: 9, requiredItemLevel: 30, weight: 400 },
            { tier: 4, minValue: 3, maxValue: 5, requiredItemLevel: 15, weight: 600 },
            { tier: 5, minValue: 1, maxValue: 2, requiredItemLevel: 1, weight: 800 },
        ],
        allowedSlots: [],
        tags: ['life', 'regen'],
    },
    // 击杀回复生命
    {
        id: AffixType.LIFE_ON_KILL,
        name: '击杀回复生命',
        description: '击杀时回复 {value} 生命',
        position: AffixPosition. SUFFIX,
        isPercent: false,
        tiers: [
            { tier: 1, minValue: 25, maxValue: 35, requiredItemLevel: 60, weight: 80 },
            { tier: 2, minValue: 18, maxValue: 24, requiredItemLevel: 45, weight: 160 },
            { tier: 3, minValue: 12, maxValue: 17, requiredItemLevel: 30, weight: 320 },
            { tier: 4, minValue: 6, maxValue: 11, requiredItemLevel: 15, weight: 500 },
            { tier: 5, minValue: 2, maxValue: 5, requiredItemLevel: 1, weight: 700 },
        ],
        allowedSlots: [],
        tags: ['life', 'kill'],
    },
    // 击杀回复魔法
    {
        id: AffixType.MANA_ON_KILL,
        name: '击杀回复魔法',
        description: '击杀时回复 {value} 魔法',
        position: AffixPosition. SUFFIX,
        isPercent: false,
        tiers: [
            { tier: 1, minValue: 15, maxValue: 20, requiredItemLevel: 60, weight: 80 },
            { tier: 2, minValue: 10, maxValue: 14, requiredItemLevel: 45, weight: 160 },
            { tier: 3, minValue: 6, maxValue: 9, requiredItemLevel: 30, weight: 320 },
            { tier: 4, minValue: 3, maxValue: 5, requiredItemLevel: 15, weight: 500 },
            { tier: 5, minValue: 1, maxValue: 2, requiredItemLevel: 1, weight: 700 },
        ],
        allowedSlots: [],
        tags: ['mana', 'kill'],
    },
];

// ========== 基底定义 ==========
export interface BaseTypeDefinition {
    id: string;
    name: string;
    slot: EquipSlot;
    icon: string;
    baseStats: { type: AffixType; value: number }[];
    requiredLevel: number;
    dropWeight: number;
}

export const BASE_TYPES: BaseTypeDefinition[] = [
    // 武器
    { id: 'sword_iron', name: '铁剑', slot: EquipSlot.WEAPON, icon: 'item_blade_of_alacrity', baseStats: [{ type: AffixType. FLAT_ATTACK_DAMAGE, value: 15 }], requiredLevel: 1, dropWeight: 100 },
    { id: 'sword_steel', name: '钢剑', slot: EquipSlot.WEAPON, icon: 'item_broadsword', baseStats: [{ type: AffixType. FLAT_ATTACK_DAMAGE, value: 30 }], requiredLevel: 20, dropWeight: 80 },
    { id: 'sword_mithril', name: '秘银剑', slot: EquipSlot.WEAPON, icon: 'item_claymore', baseStats: [{ type: AffixType.FLAT_ATTACK_DAMAGE, value: 50 }], requiredLevel: 40, dropWeight: 50 },
    { id: 'sword_dragon', name: '龙骨剑', slot: EquipSlot.WEAPON, icon: 'item_reaver', baseStats: [{ type: AffixType.FLAT_ATTACK_DAMAGE, value: 75 }], requiredLevel: 60, dropWeight: 20 },

    // 头盔
    { id: 'helmet_leather', name: '皮帽', slot: EquipSlot.HELMET, icon: 'item_helm_of_iron_will', baseStats: [{ type: AffixType.FLAT_ARMOR, value: 2 }], requiredLevel: 1, dropWeight: 100 },
    { id: 'helmet_iron', name: '铁盔', slot: EquipSlot.HELMET, icon: 'item_helm_of_the_dominator', baseStats: [{ type: AffixType.FLAT_ARMOR, value: 5 }], requiredLevel: 20, dropWeight: 80 },
    { id: 'helmet_plate', name: '板甲头盔', slot: EquipSlot.HELMET, icon: 'item_assault', baseStats: [{ type: AffixType.FLAT_ARMOR, value: 10 }], requiredLevel: 40, dropWeight: 50 },

    // 护甲
    { id: 'armor_cloth', name: '布甲', slot: EquipSlot. ARMOR, icon: 'item_robe_of_the_magi', baseStats: [{ type: AffixType.FLAT_ARMOR, value: 3 }], requiredLevel: 1, dropWeight: 100 },
    { id: 'armor_chain', name: '链甲', slot: EquipSlot. ARMOR, icon: 'item_chainmail', baseStats: [{ type: AffixType.FLAT_ARMOR, value: 8 }], requiredLevel: 20, dropWeight: 80 },
    { id: 'armor_plate', name: '板甲', slot: EquipSlot. ARMOR, icon: 'item_platemail', baseStats: [{ type: AffixType.FLAT_ARMOR, value: 15 }], requiredLevel: 40, dropWeight: 50 },

    // 手套
    { id: 'gloves_cloth', name: '布手套', slot: EquipSlot. GLOVES, icon: 'item_gloves', baseStats: [], requiredLevel: 1, dropWeight: 100 },
    { id: 'gloves_leather', name: '皮手套', slot: EquipSlot.GLOVES, icon: 'item_power_treads', baseStats: [{ type: AffixType. FLAT_ARMOR, value: 2 }], requiredLevel: 20, dropWeight: 80 },

    // 鞋子
    { id: 'boots_leather', name: '皮靴', slot: EquipSlot.BOOTS, icon: 'item_boots', baseStats: [], requiredLevel: 1, dropWeight: 100 },
    { id: 'boots_iron', name: '铁靴', slot: EquipSlot.BOOTS, icon: 'item_phase_boots', baseStats: [{ type: AffixType. FLAT_ARMOR, value: 3 }], requiredLevel: 20, dropWeight: 80 },

    // 腰带
    { id: 'belt_cloth', name: '布腰带', slot: EquipSlot.BELT, icon: 'item_belt_of_strength', baseStats: [], requiredLevel: 1, dropWeight: 100 },
    { id: 'belt_leather', name: '皮腰带', slot: EquipSlot.BELT, icon: 'item_vitality_booster', baseStats: [{ type: AffixType.FLAT_HEALTH, value: 30 }], requiredLevel: 20, dropWeight: 80 },

    // 戒指
    { id: 'ring_iron', name: '铁戒指', slot: EquipSlot.RING1, icon: 'item_ring_of_protection', baseStats: [], requiredLevel: 1, dropWeight: 100 },
    { id: 'ring_gold', name: '金戒指', slot: EquipSlot.RING1, icon: 'item_ring_of_aquila', baseStats: [], requiredLevel: 20, dropWeight: 80 },

    // 项链
    { id: 'amulet_stone', name: '石质护符', slot: EquipSlot.AMULET, icon: 'item_talisman_of_evasion', baseStats: [], requiredLevel: 1, dropWeight: 100 },
    { id: 'amulet_gold', name: '金质护符', slot: EquipSlot.AMULET, icon: 'item_medallion_of_courage', baseStats: [], requiredLevel: 20, dropWeight: 80 },
];