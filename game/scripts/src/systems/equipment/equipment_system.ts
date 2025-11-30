/**
 * POE2风格装备系统 - 核心逻辑
 */

import {
    ItemRarity,
    RARITY_NAMES,
    RARITY_COLORS,
    RARITY_AFFIX_LIMIT,
    EquipSlot,
    SLOT_NAMES,
    CurrencyType,
    CURRENCY_NAMES,
    AffixPosition,
    AffixType,
    AffixDefinition,
    AffixTier,
    AFFIX_POOL,
    BaseTypeDefinition,
    BASE_TYPES,
} from './equipment_config';

// ========== 词缀实例 ==========
export interface AffixInstance {
    affixId: AffixType;
    tier: number;
    value: number;
    position: AffixPosition;
}

// ========== 装备实例 ==========
export interface EquipmentInstance {
    id: string;
    baseTypeId: string;
    name: string;
    rarity: ItemRarity;
    itemLevel: number;
    prefixes: AffixInstance[];
    suffixes: AffixInstance[];
    identified: boolean;    // 是否已鉴定
    corrupted: boolean;     // 是否已腐化（腐化后无法修改）
}

// ========== 玩家装备数据 ==========
export interface PlayerEquipmentData {
    equipped: Record<string, EquipmentInstance | null>;  // 已装备
    inventory: EquipmentInstance[];                       // 背包
    currency: Record<CurrencyType, number>;               // 通货
}

// ========== 装备系统类 ==========
class EquipmentSystemClass {
    private playerData: Map<PlayerID, PlayerEquipmentData> = new Map();
    private itemIdCounter: number = 0;
    private initialized: boolean = false;

    // ==================== 初始化 ====================
    public Init(): void {
        if (this. initialized) return;

        print('[EquipmentSystem] ========================================');
        print('[EquipmentSystem] 初始化 POE2 风格装备系统');
        print('[EquipmentSystem] ========================================');

        this.RegisterEventListeners();
        this.initialized = true;

        print('[EquipmentSystem] 初始化完成');
    }

    private RegisterEventListeners(): void {
        // 请求装备数据
        CustomGameEventManager.RegisterListener('equipment_request_data', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            this.SendDataToClient(playerId);
        });

        // 装备物品
        CustomGameEventManager.RegisterListener('equipment_equip_item', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            const itemId = data.itemId as string;
            const slot = data.slot as EquipSlot;
            this. EquipItem(playerId, itemId, slot);
        });

        // 卸下装备
        CustomGameEventManager.RegisterListener('equipment_unequip_item', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            const slot = data.slot as EquipSlot;
            this.UnequipItem(playerId, slot);
        });

        // 使用通货
        CustomGameEventManager. RegisterListener('equipment_use_currency', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            const itemId = data.itemId as string;
            const currencyType = data.currencyType as CurrencyType;
            this.UseCurrency(playerId, itemId, currencyType);
        });

        // 丢弃装备
        CustomGameEventManager.RegisterListener('equipment_discard_item', (_, data: any) => {
            const playerId = data.PlayerID as PlayerID;
            const itemId = data.itemId as string;
            this.DiscardItem(playerId, itemId);
        });

        print('[EquipmentSystem] 事件监听已注册');
    }

    // ==================== 玩家初始化 ====================
    public InitPlayer(playerId: PlayerID): void {
        print('[EquipmentSystem] 初始化玩家: ' + playerId);

        const emptyEquipped: Record<string, EquipmentInstance | null> = {};
        for (const slot of Object.values(EquipSlot)) {
            emptyEquipped[slot] = null;
        }

        this.playerData. set(playerId, {
            equipped: emptyEquipped,
            inventory: [],
            currency: {
                [CurrencyType.EXALTED]: 5,
                [CurrencyType. CHAOS]: 10,
                [CurrencyType.DIVINE]: 3,
            },
        });

        // 添加测试装备
        this.AddTestItems(playerId);

        this.SendDataToClient(playerId);
    }

    private AddTestItems(playerId: PlayerID): void {
        // 添加几件测试装备
        const item1 = this.CreateRandomItem('sword_steel', 30, ItemRarity.RARE);
        const item2 = this.CreateRandomItem('helmet_iron', 25, ItemRarity.MAGIC);
        const item3 = this.CreateRandomItem('armor_chain', 28, ItemRarity.RARE);
        const item4 = this.CreateRandomItem('boots_leather', 15, ItemRarity.NORMAL);
        const item5 = this.CreateRandomItem('ring_gold', 35, ItemRarity.RARE);
        const item6 = this. CreateRandomItem('amulet_gold', 40, ItemRarity. MAGIC);

        this.AddItemToInventory(playerId, item1);
        this.AddItemToInventory(playerId, item2);
        this.AddItemToInventory(playerId, item3);
        this.AddItemToInventory(playerId, item4);
        this.AddItemToInventory(playerId, item5);
        this.AddItemToInventory(playerId, item6);

        print('[EquipmentSystem] 添加了 6 件测试装备');
    }

    // ==================== 装备生成 ====================
    private GenerateItemId(): string {
        this.itemIdCounter++;
        return 'item_' + this.itemIdCounter + '_' + RandomInt(1000, 9999);
    }

    public CreateRandomItem(baseTypeId: string, itemLevel: number, rarity: ItemRarity): EquipmentInstance {
        const baseType = BASE_TYPES.find(b => b.id === baseTypeId);
        if (!baseType) {
            print('[EquipmentSystem] 未知基底: ' + baseTypeId);
            return this.CreateRandomItem('sword_iron', itemLevel, rarity);
        }

        const item: EquipmentInstance = {
            id: this.GenerateItemId(),
            baseTypeId: baseTypeId,
            name: this.GenerateItemName(baseType, rarity),
            rarity: rarity,
            itemLevel: itemLevel,
            prefixes: [],
            suffixes: [],
            identified: rarity === ItemRarity.NORMAL,
            corrupted: false,
        };

        // 生成词缀
        if (rarity !== ItemRarity.NORMAL) {
            this.RollAffixes(item);
        }

        return item;
    }

    private GenerateItemName(baseType: BaseTypeDefinition, rarity: ItemRarity): string {
        if (rarity === ItemRarity. NORMAL) {
            return baseType. name;
        }
        
        const prefixNames = ['锋利的', '坚固的', '强力的', '迅捷的', '炽热的', '寒冰的', '雷霆的', '神圣的', '黑暗的', '古老的'];
        const suffixNames = ['之力', '之怒', '之心', '之魂', '守护', '毁灭', '征服', '荣耀', '永恒', '命运'];

        if (rarity === ItemRarity. MAGIC) {
            if (RandomInt(0, 1) === 0) {
                return prefixNames[RandomInt(0, prefixNames.length - 1)] + baseType.name;
            } else {
                return baseType.name + suffixNames[RandomInt(0, suffixNames.length - 1)];
            }
        }

        // RARE 或 LEGENDARY
        return prefixNames[RandomInt(0, prefixNames.length - 1)] + baseType.name + suffixNames[RandomInt(0, suffixNames.length - 1)];
    }

    // ==================== 词缀系统 ====================
    private RollAffixes(item: EquipmentInstance): void {
        const limits = RARITY_AFFIX_LIMIT[item.rarity];
        const baseType = BASE_TYPES.find(b => b.id === item. baseTypeId);
        if (!baseType) return;

        // 决定词缀数量
        let prefixCount = 0;
        let suffixCount = 0;

        if (item.rarity === ItemRarity.MAGIC) {
            // 魔法物品：1-2条词缀，至少1条
            const total = RandomInt(1, 2);
            if (total === 1) {
                if (RandomInt(0, 1) === 0) prefixCount = 1;
                else suffixCount = 1;
            } else {
                prefixCount = 1;
                suffixCount = 1;
            }
        } else if (item.rarity === ItemRarity.RARE) {
            // 稀有物品：4-6条词缀
            prefixCount = RandomInt(2, 3);
            suffixCount = RandomInt(2, 3);
        } else if (item.rarity === ItemRarity.LEGENDARY) {
            // 传说物品：6条词缀
            prefixCount = 3;
            suffixCount = 3;
        }

        // 生成前缀
        item.prefixes = [];
        for (let i = 0; i < prefixCount; i++) {
            const affix = this.RollOneAffix(item, AffixPosition.PREFIX, baseType. slot);
            if (affix) {
                item.prefixes.push(affix);
            }
        }

        // 生成后缀
        item.suffixes = [];
        for (let i = 0; i < suffixCount; i++) {
            const affix = this.RollOneAffix(item, AffixPosition.SUFFIX, baseType.slot);
            if (affix) {
                item.suffixes.push(affix);
            }
        }
    }

    private RollOneAffix(item: EquipmentInstance, position: AffixPosition, slot: EquipSlot): AffixInstance | null {
        // 获取可用词缀
        const availableAffixes = AFFIX_POOL. filter(affix => {
            // 位置匹配
            if (affix.position !== position) return false;

            // 槽位限制
            if (affix. allowedSlots. length > 0) {
                // 处理戒指槽位
                let checkSlot = slot;
                if (slot === EquipSlot. RING2) checkSlot = EquipSlot.RING1;
                if (affix.allowedSlots.indexOf(checkSlot) === -1 && affix.allowedSlots.indexOf(slot) === -1) {
                    return false;
                }
            }

            // 检查是否已有相同词缀
            const existingAffixes = position === AffixPosition.PREFIX ?  item.prefixes : item.suffixes;
            if (existingAffixes.some(a => a.affixId === affix.id)) {
                return false;
            }

            // 检查是否有可用层级
            const availableTiers = affix.tiers.filter(t => t.requiredItemLevel <= item.itemLevel);
            if (availableTiers. length === 0) return false;

            return true;
        });

        if (availableAffixes.length === 0) {
            return null;
        }

        // 加权随机选择词缀
        const selectedAffix = this.WeightedRandomSelect(availableAffixes, item.itemLevel);
        if (! selectedAffix) return null;

        // 选择层级
        const availableTiers = selectedAffix.tiers. filter(t => t.requiredItemLevel <= item.itemLevel);
        const selectedTier = this.WeightedRandomSelectTier(availableTiers);
        if (!selectedTier) return null;

        // 随机数值
        const value = RandomInt(selectedTier.minValue, selectedTier.maxValue);

        return {
            affixId: selectedAffix.id,
            tier: selectedTier.tier,
            value: value,
            position: position,
        };
    }

    private WeightedRandomSelect(affixes: AffixDefinition[], itemLevel: number): AffixDefinition | null {
        // 计算总权重
        let totalWeight = 0;
        const weights: number[] = [];

        for (const affix of affixes) {
            // 使用最高可用层级的权重
            const availableTiers = affix.tiers.filter(t => t. requiredItemLevel <= itemLevel);
            if (availableTiers.length === 0) {
                weights.push(0);
                continue;
            }
            const bestTier = availableTiers. reduce((a, b) => a.tier < b.tier ? a : b);
            weights.push(bestTier.weight);
            totalWeight += bestTier.weight;
        }

        if (totalWeight === 0) return null;

        // 随机选择
        let random = RandomInt(1, totalWeight);
        for (let i = 0; i < affixes.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return affixes[i];
            }
        }

        return affixes[affixes.length - 1];
    }

    private WeightedRandomSelectTier(tiers: AffixTier[]): AffixTier | null {
        if (tiers.length === 0) return null;

        let totalWeight = 0;
        for (const tier of tiers) {
            totalWeight += tier.weight;
        }

        let random = RandomInt(1, totalWeight);
        for (const tier of tiers) {
            random -= tier.weight;
            if (random <= 0) {
                return tier;
            }
        }

        return tiers[tiers.length - 1];
    }

    // ==================== 通货系统 ====================
    public UseCurrency(playerId: PlayerID, itemId: string, currencyType: CurrencyType): boolean {
        const data = this.playerData.get(playerId);
        if (!data) return false;

        // 检查通货数量
        if ((data.currency[currencyType] || 0) <= 0) {
            this.SendError(playerId, '通货不足');
            return false;
        }

        // 查找装备
        const item = data.inventory.find(i => i.id === itemId);
        if (! item) {
            this.SendError(playerId, '装备不存在');
            return false;
        }

        // 检查是否腐化
        if (item. corrupted) {
            this. SendError(playerId, '腐化物品无法修改');
            return false;
        }

        let success = false;

        switch (currencyType) {
            case CurrencyType.EXALTED:
                success = this.UseExaltedOrb(item);
                break;
            case CurrencyType.CHAOS:
                success = this.UseChaosOrb(item);
                break;
            case CurrencyType.DIVINE:
                success = this.UseDivineOrb(item);
                break;
        }

        if (success) {
            data.currency[currencyType]--;
            this.SendDataToClient(playerId);

            const player = PlayerResource.GetPlayer(playerId);
            if (player) {
                GameRules.SendCustomMessage(
                    '<font color="#ffd700">使用 ' + CURRENCY_NAMES[currencyType] + ' 成功! </font>',
                    playerId,
                    0
                );
            }
        }

        return success;
    }

    // 崇高石：增加一条词缀
    private UseExaltedOrb(item: EquipmentInstance): boolean {
        if (item.rarity !== ItemRarity.RARE) {
            this.SendErrorToAll('崇高石只能用于稀有物品');
            return false;
        }

        const limits = RARITY_AFFIX_LIMIT[item.rarity];
        const baseType = BASE_TYPES. find(b => b.id === item.baseTypeId);
        if (!baseType) return false;

        // 检查是否还能添加词缀
        const canAddPrefix = item.prefixes.length < limits.maxPrefix;
        const canAddSuffix = item.suffixes.length < limits.maxSuffix;

        if (!canAddPrefix && !canAddSuffix) {
            this.SendErrorToAll('该物品词缀已满');
            return false;
        }

        // 随机选择添加前缀还是后缀
        let position: AffixPosition;
        if (canAddPrefix && canAddSuffix) {
            position = RandomInt(0, 1) === 0 ? AffixPosition.PREFIX : AffixPosition.SUFFIX;
        } else if (canAddPrefix) {
            position = AffixPosition.PREFIX;
        } else {
            position = AffixPosition.SUFFIX;
        }

        const newAffix = this.RollOneAffix(item, position, baseType.slot);
        if (! newAffix) {
            this.SendErrorToAll('没有可用的词缀');
            return false;
        }

        if (position === AffixPosition.PREFIX) {
            item.prefixes. push(newAffix);
        } else {
            item.suffixes.push(newAffix);
        }

        print('[EquipmentSystem] 崇高石: 添加词缀 ' + newAffix.affixId);
        return true;
    }

    // 混沌石：重随所有词缀
    private UseChaosOrb(item: EquipmentInstance): boolean {
        if (item.rarity !== ItemRarity.RARE) {
            this.SendErrorToAll('混沌石只能用于稀有物品');
            return false;
        }

        // 清空词缀
        item.prefixes = [];
        item.suffixes = [];

        // 重新生成
        this.RollAffixes(item);

        // 重新生成名字
        const baseType = BASE_TYPES.find(b => b.id === item.baseTypeId);
        if (baseType) {
            item. name = this.GenerateItemName(baseType, item.rarity);
        }

        print('[EquipmentSystem] 混沌石: 重随词缀, 新前缀数=' + item.prefixes.length + ', 新后缀数=' + item.suffixes.length);
        return true;
    }

    // 神圣石：重随数值
    private UseDivineOrb(item: EquipmentInstance): boolean {
        if (item.rarity === ItemRarity.NORMAL) {
            this.SendErrorToAll('神圣石不能用于普通物品');
            return false;
        }

        if (item.prefixes.length === 0 && item.suffixes.length === 0) {
            this.SendErrorToAll('该物品没有词缀');
            return false;
        }

        // 重随所有词缀的数值
        for (const affix of item.prefixes) {
            this.RerollAffixValue(affix);
        }
        for (const affix of item.suffixes) {
            this.RerollAffixValue(affix);
        }

        print('[EquipmentSystem] 神圣石: 重随数值');
        return true;
    }

    private RerollAffixValue(affix: AffixInstance): void {
        const affixDef = AFFIX_POOL.find(a => a.id === affix.affixId);
        if (!affixDef) return;

        const tier = affixDef.tiers.find(t => t.tier === affix.tier);
        if (!tier) return;

        affix.value = RandomInt(tier.minValue, tier.maxValue);
    }

    // ==================== 装备穿戴 ====================
    public EquipItem(playerId: PlayerID, itemId: string, slot: EquipSlot): boolean {
        const data = this. playerData.get(playerId);
        if (!data) return false;

        // 从背包查找
        const itemIndex = data.inventory.findIndex(i => i.id === itemId);
        if (itemIndex === -1) {
            this. SendError(playerId, '装备不存在');
            return false;
        }

        const item = data.inventory[itemIndex];
        const baseType = BASE_TYPES.find(b => b.id === item.baseTypeId);
        if (!baseType) return false;

        // 检查槽位是否匹配
        let targetSlot = slot;
        if (baseType.slot === EquipSlot.RING1 && (slot === EquipSlot. RING1 || slot === EquipSlot.RING2)) {
            targetSlot = slot;
        } else if (baseType.slot !== slot && !(baseType.slot === EquipSlot.RING1 && slot === EquipSlot. RING2)) {
            this.SendError(playerId, '槽位不匹配');
            return false;
        }

        // 卸下旧装备
        const oldItem = data.equipped[targetSlot];
        if (oldItem) {
            data.inventory. push(oldItem);
        }

        // 穿上新装备
        data.inventory. splice(itemIndex, 1);
        data.equipped[targetSlot] = item;

        // 刷新英雄属性
        this.RefreshHeroStats(playerId);

        this.SendDataToClient(playerId);
        print('[EquipmentSystem] 装备: ' + item.name + ' -> ' + targetSlot);
        return true;
    }

    public UnequipItem(playerId: PlayerID, slot: EquipSlot): boolean {
        const data = this. playerData.get(playerId);
        if (!data) return false;

        const item = data. equipped[slot];
        if (! item) {
            this.SendError(playerId, '该槽位没有装备');
            return false;
        }

        data.equipped[slot] = null;
        data.inventory.push(item);

        // 刷新英雄属性
        this.RefreshHeroStats(playerId);

        this.SendDataToClient(playerId);
        print('[EquipmentSystem] 卸下: ' + item.name + ' <- ' + slot);
        return true;
    }

    public DiscardItem(playerId: PlayerID, itemId: string): boolean {
        const data = this.playerData.get(playerId);
        if (!data) return false;

        const itemIndex = data.inventory.findIndex(i => i.id === itemId);
        if (itemIndex === -1) {
            this.SendError(playerId, '装备不存在');
            return false;
        }

        const item = data.inventory[itemIndex];
        data.inventory.splice(itemIndex, 1);

        this.SendDataToClient(playerId);
        print('[EquipmentSystem] 丢弃: ' + item.name);
        return true;
    }

    // ==================== 属性计算 ====================
    public RefreshHeroStats(playerId: PlayerID): void {
        const data = this.playerData.get(playerId);
        if (! data) return;

        const hero = PlayerResource.GetSelectedHeroEntity(playerId) as CDOTA_BaseNPC_Hero;
        if (!hero || hero.IsNull()) return;

        // 计算所有装备的属性总和
        const totalStats = this. CalculateTotalStats(data);

        // 更新全局表供 modifier 读取
        // 这里与现有的 EquipmentVaultSystem 集成
        // 后续可以统一到一个系统

        print('[EquipmentSystem] 刷新属性完成');
    }

    public CalculateTotalStats(data: PlayerEquipmentData): Record<string, number> {
        const stats: Record<string, number> = {
            strength: 0,
            agility: 0,
            intelligence: 0,
            health: 0,
            mana: 0,
            armor: 0,
            attack_damage: 0,
            attack_speed: 0,
            move_speed: 0,
            crit_chance: 0,
            crit_multiplier: 0,
            fire_resistance: 0,
            cold_resistance: 0,
            lightning_resistance: 0,
            cooldown_reduction: 0,
            life_leech: 0,
            life_regen: 0,
            // 增幅伤害
            inc_physical_damage: 0,
            inc_elemental_damage: 0,
            inc_fire_damage: 0,
            inc_cold_damage: 0,
            inc_lightning_damage: 0,
            // 额外伤害
            more_damage: 0,
        };

        // 遍历所有已装备物品
        for (const slot of Object.values(EquipSlot)) {
            const item = data.equipped[slot];
            if (!item) continue;

            // 基底属性
            const baseType = BASE_TYPES.find(b => b.id === item. baseTypeId);
            if (baseType) {
                for (const baseStat of baseType.baseStats) {
                    const key = this.AffixTypeToStatKey(baseStat.type);
                    if (key) {
                        stats[key] = (stats[key] || 0) + baseStat.value;
                    }
                }
            }

            // 词缀属性
            for (const affix of item.prefixes) {
                const key = this.AffixTypeToStatKey(affix.affixId);
                if (key) {
                    stats[key] = (stats[key] || 0) + affix.value;
                }
            }
            for (const affix of item.suffixes) {
                const key = this.AffixTypeToStatKey(affix.affixId);
                if (key) {
                    stats[key] = (stats[key] || 0) + affix.value;
                }
            }
        }

        return stats;
    }

    private AffixTypeToStatKey(affixType: AffixType): string | null {
        const mapping: Record<string, string> = {
            [AffixType.FLAT_STRENGTH]: 'strength',
            [AffixType.FLAT_AGILITY]: 'agility',
            [AffixType.FLAT_INTELLIGENCE]: 'intelligence',
            [AffixType.FLAT_HEALTH]: 'health',
            [AffixType.FLAT_MANA]: 'mana',
            [AffixType.FLAT_ARMOR]: 'armor',
            [AffixType.FLAT_ATTACK_DAMAGE]: 'attack_damage',
            [AffixType.INCREASED_PHYSICAL_DAMAGE]: 'inc_physical_damage',
            [AffixType. INCREASED_ELEMENTAL_DAMAGE]: 'inc_elemental_damage',
            [AffixType.INCREASED_FIRE_DAMAGE]: 'inc_fire_damage',
            [AffixType.INCREASED_COLD_DAMAGE]: 'inc_cold_damage',
            [AffixType.INCREASED_LIGHTNING_DAMAGE]: 'inc_lightning_damage',
            [AffixType.MORE_DAMAGE]: 'more_damage',
            [AffixType.INCREASED_ATTACK_SPEED]: 'attack_speed',
            [AffixType.CRIT_CHANCE]: 'crit_chance',
            [AffixType.CRIT_MULTIPLIER]: 'crit_multiplier',
            [AffixType.FIRE_RESISTANCE]: 'fire_resistance',
            [AffixType. COLD_RESISTANCE]: 'cold_resistance',
            [AffixType.LIGHTNING_RESISTANCE]: 'lightning_resistance',
            [AffixType. ALL_RESISTANCE]: 'all_resistance',
            [AffixType. COOLDOWN_REDUCTION]: 'cooldown_reduction',
            [AffixType.LIFE_LEECH]: 'life_leech',
            [AffixType.MOVE_SPEED]: 'move_speed',
            [AffixType.LIFE_REGEN]: 'life_regen',
            [AffixType.LIFE_ON_KILL]: 'life_on_kill',
            [AffixType.MANA_ON_KILL]: 'mana_on_kill',
        };
        return mapping[affixType] || null;
    }

    // ==================== 装备掉落 ====================
    public DropRandomItem(playerId: PlayerID, monsterLevel: number, rarity?: ItemRarity): EquipmentInstance | null {
        // 随机选择基底
        const availableBases = BASE_TYPES. filter(b => b.requiredLevel <= monsterLevel);
        if (availableBases.length === 0) return null;

        const baseType = this.WeightedRandomSelectBase(availableBases);
        if (!baseType) return null;

        // 决定品质
        if (! rarity) {
            rarity = this.RollRarity(monsterLevel);
        }

        // 物品等级 = 怪物等级 ± 随机偏移
        const itemLevel = Math.max(1, monsterLevel + RandomInt(-2, 2));

        const item = this.CreateRandomItem(baseType. id, itemLevel, rarity);

        // 添加到背包
        this.AddItemToInventory(playerId, item);

        return item;
    }

    private WeightedRandomSelectBase(bases: BaseTypeDefinition[]): BaseTypeDefinition | null {
        let totalWeight = 0;
        for (const base of bases) {
            totalWeight += base.dropWeight;
        }

        let random = RandomInt(1, totalWeight);
        for (const base of bases) {
            random -= base.dropWeight;
            if (random <= 0) {
                return base;
            }
        }

        return bases[bases.length - 1];
    }

    private RollRarity(monsterLevel: number): ItemRarity {
        const roll = RandomInt(1, 1000);

        // 基础概率，怪物等级越高，高品质概率越高
        const legendaryChance = Math.min(5, 1 + monsterLevel / 20);     // 0.1% - 0.5%
        const rareChance = Math.min(150, 50 + monsterLevel);            // 5% - 15%
        const magicChance = Math.min(400, 200 + monsterLevel * 2);      // 20% - 40%

        if (roll <= legendaryChance) return ItemRarity.LEGENDARY;
        if (roll <= legendaryChance + rareChance) return ItemRarity.RARE;
        if (roll <= legendaryChance + rareChance + magicChance) return ItemRarity.MAGIC;
        return ItemRarity.NORMAL;
    }

    public AddItemToInventory(playerId: PlayerID, item: EquipmentInstance): void {
        const data = this.playerData.get(playerId);
        if (! data) return;

        data.inventory.push(item);
        this.SendDataToClient(playerId);
    }

    public AddCurrency(playerId: PlayerID, currencyType: CurrencyType, amount: number): void {
        const data = this.playerData. get(playerId);
        if (!data) return;

        data.currency[currencyType] = (data.currency[currencyType] || 0) + amount;
        this.SendDataToClient(playerId);
    }

    // ==================== 数据发送 ====================
    public SendDataToClient(playerId: PlayerID): void {
        const player = PlayerResource.GetPlayer(playerId);
        if (! player) return;

        const data = this.playerData.get(playerId);
        if (! data) return;

        // 序列化装备数据
        const equippedData: Record<string, any> = {};
        for (const slot of Object. values(EquipSlot)) {
            const item = data. equipped[slot];
            equippedData[slot] = item ? this.SerializeItem(item) : null;
        }

        const inventoryData: any[] = [];
        for (const item of data.inventory) {
            inventoryData.push(this. SerializeItem(item));
        }

        (CustomGameEventManager. Send_ServerToPlayer as any)(
            player,
            'equipment_data_update',
            {
                equipped: equippedData,
                inventory: inventoryData,
                currency: data.currency,
            }
        );
    }

    private SerializeItem(item: EquipmentInstance): any {
        const baseType = BASE_TYPES.find(b => b.id === item.baseTypeId);
        
        return {
            id: item.id,
            baseTypeId: item.baseTypeId,
            baseName: baseType?.name || '',
            baseIcon: baseType?.icon || '',
            slot: baseType?.slot || '',
            name: item.name,
            rarity: item.rarity,
            rarityName: RARITY_NAMES[item. rarity],
            rarityColor: RARITY_COLORS[item.rarity],
            itemLevel: item.itemLevel,
            prefixes: item.prefixes.map(a => this.SerializeAffix(a)),
            suffixes: item.suffixes.map(a => this.SerializeAffix(a)),
            identified: item.identified,
            corrupted: item.corrupted,
        };
    }

    private SerializeAffix(affix: AffixInstance): any {
        const affixDef = AFFIX_POOL.find(a => a.id === affix.affixId);
        if (!affixDef) {
            return {
                id: affix. affixId,
                name: '未知',
                description: '未知词缀',
                tier: affix.tier,
                value: affix.value,
                isPercent: false,
            };
        }

        // 替换描述中的 {value}
        const description = affixDef.description. replace('{value}', affix.value.toString());

        return {
            id: affix.affixId,
            name: affixDef.name,
            description: description,
            tier: affix.tier,
            value: affix.value,
            isPercent: affixDef.isPercent,
        };
    }

    private SendError(playerId: PlayerID, message: string): void {
        const player = PlayerResource.GetPlayer(playerId);
        if (! player) return;

        (CustomGameEventManager.Send_ServerToPlayer as any)(
            player,
            'equipment_error',
            { message: message }
        );
    }

    private SendErrorToAll(message: string): void {
        print('[EquipmentSystem] Error: ' + message);
    }

    // ==================== 公共接口 ====================
    public GetPlayerData(playerId: PlayerID): PlayerEquipmentData | undefined {
        return this.playerData.get(playerId);
    }
}

// ========== 导出 ==========
export const EquipmentSystem = new EquipmentSystemClass();

export function InitEquipmentSystem(): void {
    EquipmentSystem.Init();
}