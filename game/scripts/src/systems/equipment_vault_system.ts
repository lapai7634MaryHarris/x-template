import { ExternalRewardItem } from "../dungeon/external_reward_pool";

// 物品类型到装备槽位的映射
const ITEM_TYPE_TO_SLOT: { [key: string]: string } = {
    "武器": "weapon",
    "护甲": "armor",
    "头盔": "helmet",
    "鞋子": "boots",
    "手套": "gloves",
    "腰带": "belt",
    "项链": "necklace",
    "戒指": "ring",
    "饰品": "trinket",
};

/** @luaTable */
declare const _G: {
    EquipmentStats: { [playerId: number]: EquipmentTotalStats };
};

if (! _G.EquipmentStats) {
    _G.EquipmentStats = {};
}

export class EquipmentVaultSystem {
    private static playerVaults: { [playerId: number]: ExternalRewardItem[] } = {};
    private static playerEquipment: { [playerId: number]: { [slot: string]: ExternalRewardItem | null } } = {};
    private static playerModifiers: { [playerId: number]: CDOTA_Buff } = {};
    private static playerBaseArmor: { [playerId: number]: number } = {};
    private static isRefreshing: { [playerId: number]: boolean } = {};
    
    static readonly MAX_VAULT_SIZE = 40;

    // ⭐ 初始化玩家装备系统
    static InitializePlayer(playerId: PlayerID, hero?: CDOTA_BaseNPC_Hero): void {
        print(`[EquipmentVaultSystem] 初始化玩家${playerId}的仓库和装备`);
        
        if (! this.playerEquipment[playerId]) {
            this.playerEquipment[playerId] = {
                helmet: null,
                necklace: null,
                ring: null,
                trinket: null,
                weapon: null,
                armor: null,
                belt: null,
                boots: null,
                gloves: null,
            };
        }
        
        if (! this.playerVaults[playerId]) {
            this.playerVaults[playerId] = [];
        }
        
        this.LoadFromPersistentStorage(playerId);
        
        if (IsServer()) {
            if (! hero) {
                hero = PlayerResource.GetSelectedHeroEntity(playerId) as CDOTA_BaseNPC_Hero;
            }
            
            if (! hero || hero.IsNull()) {
                print(`[EquipmentVaultSystem] ❌ 玩家${playerId}的英雄不存在`);
                return;
            }
            
            print(`[EquipmentVaultSystem] ✓ 找到玩家${playerId}的英雄：${hero.GetUnitName()}`);
            
            if (this.playerBaseArmor[playerId] === undefined) {
                this.playerBaseArmor[playerId] = hero.GetPhysicalArmorBaseValue();
                print(`[EquipmentVaultSystem] 📝 记录基础护甲: ${this.playerBaseArmor[playerId]}`);
            }
            
            _G.EquipmentStats[playerId] = this.CreateEmptyStats();
            
            const existingModifier = hero.FindModifierByName("modifier_equipment_system");
            if (existingModifier && ! existingModifier.IsNull()) {
                print(`[EquipmentVaultSystem] ⚠️ 已有装备系统 Modifier`);
                this.playerModifiers[playerId] = existingModifier;
            } else {
                print(`[EquipmentVaultSystem] 尝试添加 modifier_equipment_system...`);
                const modifier = hero.AddNewModifier(hero, undefined, "modifier_equipment_system", {});
                if (modifier && ! modifier.IsNull()) {
                    this.playerModifiers[playerId] = modifier;
                    print(`[EquipmentVaultSystem] ✓ Modifier 创建成功`);
                } else {
                    print(`[EquipmentVaultSystem] ❌ Modifier 创建失败`);
                }
            }
            
            this.RefreshEquipmentStats(playerId);
            this.PushDataToClient(playerId);
        }
    }

    // ⭐ 创建空属性对象
    private static CreateEmptyStats(): EquipmentTotalStats {
        return {
            strength: 0,
            agility: 0,
            intelligence: 0,
            armor: 0,
            health: 0,
            mana: 0,
            attack_damage: 0,
            attack_speed: 0,
            move_speed: 0,
            magic_resistance: 0,
            crit_chance: 0,
            crit_multiplier: 0,
            cooldown_reduction: 0,
            fire_resistance: 0,
            cold_resistance: 0,
            lightning_resistance: 0,
            evasion: 0,
        };
    }

    // ⭐⭐⭐ 使用 XNetTable 推送数据到客户端
    static PushDataToClient(playerId: PlayerID): void {
        if (! IsServer()) return;
        
        const vault = this.GetVault(playerId);
        const equipment = this.GetEquipment(playerId);
        const stats = _G.EquipmentStats[playerId] || this.CreateEmptyStats();
        
        // 转换仓库数据
        const vaultItems: VaultItemData[] = [];
        for (let i = 0; i < vault.length; i++) {
            const item = vault[i];
            vaultItems.push(this.ConvertToVaultItemData(item, 'vault_' + i));
        }
        
        // 转换已装备数据
        const equippedItems: { [slot: string]: VaultItemData | null } = {};
        for (const slot in equipment) {
            const item = equipment[slot];
            if (item) {
                equippedItems[slot] = this.ConvertToVaultItemData(item, 'eq_' + slot);
            } else {
                equippedItems[slot] = null;
            }
        }
        
        // ⭐ 使用 XNetTable 发送数据
        GameRules.XNetTable.SetPlayerTableValue(playerId, 'equipment_data', 'vault', {
            items: vaultItems,
            maxSize: this.MAX_VAULT_SIZE,
        });
        
        GameRules.XNetTable.SetPlayerTableValue(playerId, 'equipment_data', 'equipped', equippedItems);
        
        GameRules.XNetTable.SetPlayerTableValue(playerId, 'equipment_data', 'stats', stats);
        
        print(`[EquipmentVaultSystem] ✓ 已推送数据到客户端 (仓库:${vaultItems.length}件, 属性已更新)`);
    }

    // ⭐ 转换物品数据格式
    private static ConvertToVaultItemData(item: ExternalRewardItem, id: string): VaultItemData {
        // 处理 stats
        const stats: Array<{ attribute: string; value: number }> = [];
        if (item.stats) {
            for (let i = 0; i < item.stats.length; i++) {
                const s = item.stats[i];
                if (s && s.attribute) {
                    stats.push({ attribute: s.attribute + '', value: s.value || 0 });
                }
            }
        }
        
        // ⭐⭐⭐ 处理 affixDetails - 转换为数组格式
        let affixDetailsArray: AffixDetailData[] | undefined = undefined;
        if (item.affixDetails) {
            affixDetailsArray = [];
            const affixData = item.affixDetails as any;
            
            // 尝试作为数组处理
            if (affixData.length !== undefined && affixData.length > 0) {
                for (let i = 0; i < affixData.length; i++) {
                    const affix = affixData[i];
                    if (affix && affix.name) {
                        affixDetailsArray.push({
                            position: affix.position || 'prefix',
                            tier: affix.tier || 1,
                            name: affix.name || '',
                            description: affix.description || '',
                            color: affix.color,
                        });
                    }
                }
            } else {
                // 作为对象处理
                for (let i = 0; i < 10; i++) {
                    const affix = affixData[i] || affixData[i.toString()];
                    if (affix && affix.name) {
                        affixDetailsArray.push({
                            position: affix.position || 'prefix',
                            tier: affix.tier || 1,
                            name: affix.name || '',
                            description: affix.description || '',
                            color: affix.color,
                        });
                    }
                }
            }
            
            if (affixDetailsArray.length === 0) {
                affixDetailsArray = undefined;
            }
        }
        
        return {
            id: id,
            name: item.name + '',
            type: item.type + '',
            icon: item.icon + '',
            rarity: item.rarity || 0,
            stats: stats,
            affixDetails: affixDetailsArray,
        };
    }

    // 保存装备到仓库
    static SaveToVault(playerId: PlayerID, item: ExternalRewardItem): void {
        print(`[EquipmentVaultSystem] 保存玩家${playerId}获得的装备：${item.name}`);
        
        if (!this.playerVaults[playerId]) {
            this.playerVaults[playerId] = [];
        }
        
        if (this.playerVaults[playerId].length >= this.MAX_VAULT_SIZE) {
            print(`[EquipmentVaultSystem] ⚠️ 仓库已满（${this.MAX_VAULT_SIZE}件），无法添加`);
            return;
        }
        
        this.playerVaults[playerId].push(item);
        this.SaveToPersistentStorage(playerId);
        this.PushDataToClient(playerId);
    }

    // 获取玩家仓库
    static GetVault(playerId: PlayerID): ExternalRewardItem[] {
        if (!this.playerVaults[playerId]) {
            this.playerVaults[playerId] = [];
        }
        return this.playerVaults[playerId];
    }

    // 获取玩家装备
    static GetEquipment(playerId: PlayerID): { [slot: string]: ExternalRewardItem | null } {
        if (!this.playerEquipment[playerId]) {
            this.playerEquipment[playerId] = {
                helmet: null,
                necklace: null,
                ring: null,
                trinket: null,
                weapon: null,
                armor: null,
                belt: null,
                boots: null,
                gloves: null,
            };
        }
        return this.playerEquipment[playerId];
    }

    // ⭐ 从仓库装备物品
    static EquipItem(playerId: PlayerID, index: number): boolean {
        const vault = this.GetVault(playerId);
        
        if (index < 0 || index >= vault.length) {
            print(`[EquipmentVaultSystem] ❌ 无效的索引：${index}`);
            return false;
        }
        
        const item = vault[index];
        const slot = ITEM_TYPE_TO_SLOT[item.type];
        
        if (! slot) {
            print(`[EquipmentVaultSystem] ❌ 未知的装备类型：${item.type}`);
            return false;
        }
        
        vault.splice(index, 1);
        print(`[EquipmentVaultSystem] 从仓库移除：${item.name}，剩余 ${vault.length} 件`);
        
        const equipment = this.GetEquipment(playerId);
        if (equipment[slot]) {
            const oldItem = equipment[slot]!;
            print(`[EquipmentVaultSystem] ${slot} 槽位已有装备：${oldItem.name}，卸下旧装备`);
            vault.push(oldItem);
        }
        
        equipment[slot] = item;
        
        this.RefreshEquipmentStats(playerId);
        this.SaveToPersistentStorage(playerId);
        this.PushDataToClient(playerId);
        
        print(`[EquipmentVaultSystem] ✓ 玩家${playerId}装备了：${item.name} 到槽位 ${slot}`);
        return true;
    }

    // ⭐ 卸下装备
    static UnequipItem(playerId: PlayerID, slot: string): boolean {
        const equipment = this.GetEquipment(playerId);
        const item = equipment[slot];
        
        if (!item) {
            print(`[EquipmentVaultSystem] ❌ 槽位 ${slot} 没有装备`);
            return false;
        }
        
        const vault = this.GetVault(playerId);
        if (vault.length >= this.MAX_VAULT_SIZE) {
            print(`[EquipmentVaultSystem] ⚠️ 仓库已满，无法卸下装备`);
            return false;
        }
        
        vault.push(item);
        equipment[slot] = null;
        
        this.RefreshEquipmentStats(playerId);
        this.SaveToPersistentStorage(playerId);
        this.PushDataToClient(playerId);
        
        print(`[EquipmentVaultSystem] ✓ 玩家${playerId}卸下了：${item.name}`);
        return true;
    }

    // ⭐⭐⭐ 刷新装备属性
    private static RefreshEquipmentStats(playerId: PlayerID): void {
        if (!IsServer()) return;
        
        if (this.isRefreshing[playerId]) {
            return;
        }
        this.isRefreshing[playerId] = true;
        
        const totalStats = this.CreateEmptyStats();
        
        const equipment = this.playerEquipment[playerId];
        if (equipment) {
            const slots = ['helmet', 'necklace', 'ring', 'trinket', 'weapon', 'armor', 'belt', 'boots', 'gloves'];
            
            for (let s = 0; s < slots.length; s++) {
                const slot = slots[s];
                const item = equipment[slot];
                
                if (! item) continue;
                
                // 方式1：读取 stats 数组
                if (item.stats) {
                    for (let i = 0; i < item.stats.length; i++) {
                        const stat = item.stats[i];
                        if (stat && stat.attribute && stat.value !== undefined) {
                            const key = this.AttributeToKey(stat.attribute);
                            if (key && (totalStats as any)[key] !== undefined) {
                                (totalStats as any)[key] = ((totalStats as any)[key] || 0) + (stat.value || 0);
                            }
                        }
                    }
                }
                
                // 方式2：读取 affixDetails
                if (item.affixDetails) {
                    const affixData = item.affixDetails as any;
                    for (const key in affixData) {
                        const affix = affixData[key];
                        if (affix && affix.description && typeof affix.description === 'string') {
                            this.ParseAffixDescription(affix.description, totalStats);
                        }
                    }
                }
            }
        }
        
        _G.EquipmentStats[playerId] = totalStats;
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId) as CDOTA_BaseNPC_Hero;
        if (hero && ! hero.IsNull()) {
            const baseArmor = this.playerBaseArmor[playerId] || 0;
            const newArmor = baseArmor + totalStats.armor;
            hero.SetPhysicalArmorBaseValue(newArmor);
            
            const modifier = hero.FindModifierByName("modifier_equipment_system");
            if (modifier && !modifier.IsNull()) {
                (modifier as any).OnRefresh({});
                print(`[EquipmentVaultSystem] ✓ Modifier 已刷新`);
            } else {
                const newModifier = hero.AddNewModifier(hero, undefined, "modifier_equipment_system", {});
                if (newModifier && !newModifier.IsNull()) {
                    this.playerModifiers[playerId] = newModifier;
                    print(`[EquipmentVaultSystem] ✓ Modifier 重新创建成功`);
                }
            }
        }
        
        this.isRefreshing[playerId] = false;
        
        print(`[EquipmentVaultSystem] 属性已刷新: 力量+${totalStats.strength}, 敏捷+${totalStats.agility}, 智力+${totalStats.intelligence}, 生命+${totalStats.health}`);
    }

    // ⭐ 解析词缀描述
    private static ParseAffixDescription(desc: string, totalStats: EquipmentTotalStats): void {
        if (!desc || typeof desc !== 'string') return;
        
        const rules: Array<{ pattern: string; key: keyof EquipmentTotalStats }> = [
            { pattern: "(%d+)%s*力量", key: 'strength' },
            { pattern: "(%d+)%s*敏捷", key: 'agility' },
            { pattern: "(%d+)%s*智力", key: 'intelligence' },
            { pattern: "(%d+)%s*护甲", key: 'armor' },
            { pattern: "(%d+)%s*生命", key: 'health' },
            { pattern: "(%d+)%s*魔法", key: 'mana' },
            { pattern: "(%d+)%s*攻击力", key: 'attack_damage' },
            { pattern: "(%d+)%%? %s*攻击速度", key: 'attack_speed' },
            { pattern: "(%d+)%s*移动速度", key: 'move_speed' },
            { pattern: "(%d+)%%?%s*暴击率", key: 'crit_chance' },
            { pattern: "(%d+)%%?%s*暴击伤害", key: 'crit_multiplier' },
            { pattern: "(%d+)%%?%s*技能冷却", key: 'cooldown_reduction' },
            { pattern: "(%d+)%%? %s*火焰抗性", key: 'fire_resistance' },
            { pattern: "(%d+)%%?%s*冰霜抗性", key: 'cold_resistance' },
            { pattern: "(%d+)%%?%s*闪电抗性", key: 'lightning_resistance' },
            { pattern: "(%d+)%%? %s*闪避", key: 'evasion' },
            { pattern: "(%d+)%%? %s*魔抗", key: 'magic_resistance' },
        ];
        
        for (const rule of rules) {
            const match = string.match(desc, rule.pattern);
            if (match && match[0]) {
                const value = tonumber(match[0]);
                if (value && value > 0) {
                    (totalStats as any)[rule.key] = ((totalStats as any)[rule.key] || 0) + value;
                }
            }
        }
    }

    // 属性名称转换为键名
    private static AttributeToKey(attribute: string): string | null {
        const mapping: { [key: string]: string } = {
            "力量": "strength",
            "敏捷": "agility",
            "智力": "intelligence",
            "护甲": "armor",
            "生命": "health",
            "魔法": "mana",
            "攻击力": "attack_damage",
            "攻击速度": "attack_speed",
            "移动速度": "move_speed",
            "魔抗": "magic_resistance",
            "暴击率": "crit_chance",
            "暴击伤害": "crit_multiplier",
        };
        return mapping[attribute] || null;
    }

    // 持久化保存
    private static SaveToPersistentStorage(playerId: PlayerID): void {
        print(`[EquipmentVaultSystem] 💾 保存到存储: ${this.playerVaults[playerId]?.length || 0} 件仓库装备`);
        // TODO: 实现持久化存储
    }

    // 从持久化存储加载
    private static LoadFromPersistentStorage(playerId: PlayerID): void {
        // TODO: 实现持久化加载
    }
}