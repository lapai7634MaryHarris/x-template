/** @luaTable */
declare const _G: any;
import { ExternalRewardItem, ExternalItemType, EquipmentAttribute } from "../dungeon/external_reward_pool";

// ⭐ 初始化全局装备属性表
_G. EquipmentStats = _G.EquipmentStats || {};

// 装备槽位枚举
export enum EquipmentSlot {
    HELMET = 'helmet',
    NECKLACE = 'necklace',
    RING = 'ring',
    TRINKET = 'trinket',
    WEAPON = 'weapon',
    ARMOR = 'armor',
    BELT = 'belt',
    BOOTS = 'boots',
}

// 装备类型映射到槽位
const ITEM_TYPE_TO_SLOT: { [key: string]: EquipmentSlot } = {
    "头盔": EquipmentSlot.HELMET,
    "项链": EquipmentSlot.NECKLACE,
    "戒指": EquipmentSlot.RING,
    "饰品": EquipmentSlot.TRINKET,
    "武器": EquipmentSlot.WEAPON,
    "护甲": EquipmentSlot.ARMOR,
    "腰带": EquipmentSlot.BELT,
    "鞋子": EquipmentSlot. BOOTS,
};

export class EquipmentVaultSystem {
    private static playerVaults: { [playerId: number]: ExternalRewardItem[] } = {};
    private static playerEquipment: { [playerId: number]: { [slot: string]: ExternalRewardItem | null } } = {};
    private static playerModifiers: { [playerId: number]: CDOTA_Buff } = {};
    private static playerBaseArmor: { [playerId: number]: number } = {};

    // 初始化玩家仓库和装备
    static InitializePlayer(playerId: PlayerID, hero?: CDOTA_BaseNPC_Hero): void {
        print(`[EquipmentVaultSystem] 初始化玩家${playerId}的仓库和装备`);
        
        // 初始化装备槽
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
            };
        }
        
        // 初始化仓库
        if (!this. playerVaults[playerId]) {
            this.playerVaults[playerId] = [];
        }
        
        // 从持久化存储加载
        this.LoadFromPersistentStorage(playerId);
        
        // 创建装备系统 Modifier
        if (IsServer()) {
            // 优先使用传入的 hero，否则从 PlayerResource 获取
            if (! hero) {
                hero = PlayerResource.GetSelectedHeroEntity(playerId) as CDOTA_BaseNPC_Hero;
            }
            
            if (! hero || hero.IsNull()) {
                print(`[EquipmentVaultSystem] ❌ 玩家${playerId}的英雄不存在`);
                return;
            }
            
            print(`[EquipmentVaultSystem] ✓ 找到玩家${playerId}的英雄：${hero.GetUnitName()}`);
            
            // ⭐ 记录英雄的原始基础护甲（只记录一次）
            if (this.playerBaseArmor[playerId] === undefined) {
                this.playerBaseArmor[playerId] = hero.GetPhysicalArmorBaseValue();
                print(`[EquipmentVaultSystem] 📝 记录基础护甲: ${this. playerBaseArmor[playerId]}`);
            }
            
            // 检查是否已经有 modifier
            const existingModifier = hero.FindModifierByName("modifier_equipment_system");
            if (existingModifier && ! existingModifier.IsNull()) {
                print(`[EquipmentVaultSystem] ⚠️ 已有装备系统 Modifier，跳过创建`);
                this.playerModifiers[playerId] = existingModifier;
                this.RefreshEquipmentStats(playerId);
                return;
            }
            
            print(`[EquipmentVaultSystem] 尝试添加 modifier_equipment_system... `);
            
            // ⭐ 初始化全局属性表
            _G.EquipmentStats[playerId] = {
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
            };
            
            const modifier = hero.AddNewModifier(hero, undefined, "modifier_equipment_system", {});
            
            if (modifier && ! modifier.IsNull()) {
                this.playerModifiers[playerId] = modifier;
                print(`[EquipmentVaultSystem] ✓ Modifier 创建成功`);
                this.RefreshEquipmentStats(playerId);
            } else {
                print(`[EquipmentVaultSystem] ❌ Modifier 创建失败`);
            }
        }
    }

    // 保存装备到仓库
    static SaveToVault(playerId: PlayerID, item: ExternalRewardItem): void {
        print(`[EquipmentVaultSystem] 保存玩家${playerId}获得的装备：${item.name}`);
        
        if (!this.playerVaults[playerId]) {
            this.playerVaults[playerId] = [];
        }
        
        this.playerVaults[playerId]. push(item);
        this.SaveToPersistentStorage(playerId);
    }

    // 获取玩家仓库
    static GetVault(playerId: PlayerID): ExternalRewardItem[] {
        if (!this.playerVaults[playerId]) {
            this. playerVaults[playerId] = [];
        }
        return this. playerVaults[playerId];
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
            };
        }
        return this.playerEquipment[playerId];
    }

    // ⭐ 深拷贝装备项（避免引用共享）
    private static DeepCloneItem(item: ExternalRewardItem): ExternalRewardItem {
        const cloned: ExternalRewardItem = {
            name: item.name,
            type: item.type,
            icon: item.icon,
            rarity: item.rarity,
            stats: [],
            affixDetails: undefined,
        };
        
        // 深拷贝 stats
        for (let i = 0; i < item.stats.length; i++) {
            cloned.stats.push({
                attribute: item.stats[i].attribute,
                value: item.stats[i].value
            });
        }
        
        // 深拷贝 affixDetails（现在一定是数组或 undefined）
        if (item.affixDetails && item.affixDetails.length > 0) {
            cloned.affixDetails = [];
            for (let i = 0; i < item.affixDetails.length; i++) {
                const affix = item.affixDetails[i];
                if (affix && affix.name) {
                    cloned.affixDetails.push({
                        position: affix.position,
                        tier: affix. tier,
                        name: affix.name,
                        description: affix.description,
                        color: affix.color,
                    });
                }
            }
            print(`[EquipmentVaultSystem] 深拷贝装备 ${item.name}，词缀: ${cloned.affixDetails.length} 个`);
        }
        
        return cloned;
    }

    // 从仓库装备物品
    static EquipItem(playerId: PlayerID, index: number): boolean {
        const vault = this.GetVault(playerId);
        
        if (index < 0 || index >= vault.length) {
            print(`[EquipmentVaultSystem] ❌ 无效的索引：${index}`);
            return false;
        }
        
        const item = vault[index];
        const slot = ITEM_TYPE_TO_SLOT[item.type];
        
        if (!slot) {
            print(`[EquipmentVaultSystem] ❌ 未知的装备类型：${item.type}`);
            return false;
        }
        
        vault. splice(index, 1);
        print(`[EquipmentVaultSystem] 从仓库移除：${item.name}，剩余 ${vault.length} 件`);
        
        const equipment = this.GetEquipment(playerId);
        if (equipment[slot]) {
            const oldItem = equipment[slot]! ;
            print(`[EquipmentVaultSystem] ${slot} 槽位已有装备：${oldItem.name}，卸下旧装备`);
            vault.push(oldItem);
        }
        
        // ⭐ 深拷贝 item，避免共享引用
        equipment[slot] = this.DeepCloneItem(item);
        this.RefreshEquipmentStats(playerId);
        this.SaveToPersistentStorage(playerId);
        
        print(`[EquipmentVaultSystem] ✓ 玩家${playerId}装备了：${item.name} 到槽位 ${slot}`);
        return true;
    }

    // 卸下装备
    static UnequipItem(playerId: PlayerID, slot: string): boolean {
        const equipment = this.GetEquipment(playerId);
        const item = equipment[slot];
        
        if (!item) {
            print(`[EquipmentVaultSystem] ❌ 槽位 ${slot} 没有装备`);
            return false;
        }
        
        this.SaveToVault(playerId, item);
        equipment[slot] = null;
        this.RefreshEquipmentStats(playerId);
        this.SaveToPersistentStorage(playerId);
        
        print(`[EquipmentVaultSystem] ✓ 玩家${playerId}卸下了：${item.name}`);
        return true;
    }

    // ⭐ 获取或创建 Modifier
    private static GetOrCreateModifier(playerId: PlayerID): CDOTA_Buff | null {
        let modifier = this.playerModifiers[playerId];
        
        // 检查 modifier 是否有效
        if (modifier && !modifier.IsNull()) {
            return modifier;
        }
        
        print("[EquipmentVaultSystem] Modifier 不存在或已失效，尝试重新获取/创建.. .");
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId) as CDOTA_BaseNPC_Hero;
        if (!hero || hero.IsNull()) {
            print("[EquipmentVaultSystem] 找不到英雄，无法获取/创建 Modifier");
            return null;
        }
        
        // 先尝试查找现有的 modifier
        const existingModifier = hero.FindModifierByName("modifier_equipment_system");
        if (existingModifier && !existingModifier.IsNull()) {
            this.playerModifiers[playerId] = existingModifier;
            print("[EquipmentVaultSystem] 找到现有 Modifier");
            return existingModifier;
        }
        
        // 记录基础护甲
        if (this.playerBaseArmor[playerId] === undefined) {
            this.playerBaseArmor[playerId] = hero.GetPhysicalArmorBaseValue();
            print("[EquipmentVaultSystem] 记录基础护甲: " + this.playerBaseArmor[playerId]);
        }
        
        // 初始化全局属性表
        if (!_G.EquipmentStats[playerId]) {
            _G.EquipmentStats[playerId] = {
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
            };
        }
        
        // 创建新的 modifier
        const newMod = hero.AddNewModifier(hero, undefined, "modifier_equipment_system", {});
        if (newMod && !newMod.IsNull()) {
            this.playerModifiers[playerId] = newMod;
            print("[EquipmentVaultSystem] 创建新 Modifier 成功");
            return newMod;
        }
        
        print("[EquipmentVaultSystem] 创建 Modifier 失败");
        return null;
    }

    // ⭐ 刷新装备属性
    private static RefreshEquipmentStats(playerId: PlayerID): void {
        const equipment = this.GetEquipment(playerId);
        
        // 获取或创建 modifier
        let modifier = this.GetOrCreateModifier(playerId);
        if (!modifier) {
            print(`[EquipmentVaultSystem] ❌ 无法获取/创建 Modifier，跳过属性刷新`);
            return;
        }
        
        const totalStats: { [key: string]: number } = {
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
        };
        
        print(`[EquipmentVaultSystem] 开始计算装备属性总和...`);
        
        for (const slot in equipment) {
            const item = equipment[slot];
            if (item) {
                print(`[EquipmentVaultSystem]   槽位 ${slot}: ${item.name}`);
                item.stats.forEach(stat => {
                    const key = this.AttributeToKey(stat.attribute);
                    if (key) {
                        totalStats[key] = (totalStats[key] || 0) + stat.value;
                        print(`[EquipmentVaultSystem]     +${stat.value} ${stat.attribute} (${key})`);
                    }
                });
            }
        }
        
        const hero = modifier.GetParent() as CDOTA_BaseNPC_Hero;
        if (! hero || hero.IsNull()) {
            print(`[EquipmentVaultSystem] ❌ Modifier 的 Parent 无效`);
            return;
        }
        
        // ⭐ 重置护甲为基础值 + 装备护甲
        const baseArmor = this.playerBaseArmor[playerId] || 0;
        const newArmor = baseArmor + totalStats.armor;
        hero.SetPhysicalArmorBaseValue(newArmor);
        print(`[EquipmentVaultSystem] 🛡️ 设置护甲: 基础(${baseArmor}) + 装备(${totalStats.armor}) = ${newArmor}`);
        
        // 销毁旧 modifier
        modifier.Destroy();
        
        print(`[EquipmentVaultSystem] ⭐ 重新创建 Modifier 以刷新属性`);
        
        // ⭐ 将属性存储到全局表
        _G.EquipmentStats[playerId] = totalStats;
        
        // ⭐ 创建新 modifier
        const newModifier = hero.AddNewModifier(hero, undefined, "modifier_equipment_system", {});

        if (newModifier && ! newModifier.IsNull()) {
            this.playerModifiers[playerId] = newModifier;
            
            print(`[EquipmentVaultSystem] ========== 装备属性总和 ==========`);
            print(`[EquipmentVaultSystem] 力量: +${totalStats.strength}`);
            print(`[EquipmentVaultSystem] 敏捷: +${totalStats.agility}`);
            print(`[EquipmentVaultSystem] 智力: +${totalStats.intelligence}`);
            print(`[EquipmentVaultSystem] 护甲: +${totalStats.armor}`);
            print(`[EquipmentVaultSystem] 生命: +${totalStats.health}`);
            print(`[EquipmentVaultSystem] 魔法: +${totalStats. mana}`);
            print(`[EquipmentVaultSystem] 攻击力: +${totalStats.attack_damage}`);
            print(`[EquipmentVaultSystem] 攻击速度: +${totalStats. attack_speed}`);
            print(`[EquipmentVaultSystem] 移动速度: +${totalStats.move_speed}`);
            print(`[EquipmentVaultSystem] 魔抗: +${totalStats.magic_resistance}`);
            print(`[EquipmentVaultSystem] =====================================`);
        } else {
            print(`[EquipmentVaultSystem] ❌ 重新创建 Modifier 失败`);
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
        };
        return mapping[attribute] || null;
    }

    // ⭐ 持久化保存（使用对象而不是数组）
    private static SaveToPersistentStorage(playerId: PlayerID): void {
        const items = this.playerVaults[playerId] || [];
        const equipment = this.playerEquipment[playerId] || {};
        
        const serializedItems: any = {};
        
        for (let idx = 0; idx < items. length; idx++) {
            const item = items[idx];
            const serialized: any = {
                name: item.name,
                type: item.type,
                icon: item.icon,
                rarity: item.rarity,
            };
            
            // ⭐ 使用对象而不是数组存储 stats
            const statsObj: any = {};
            for (let i = 0; i < item.stats.length; i++) {
                statsObj[i. toString()] = {
                    attribute: item.stats[i].attribute,
                    value: item.stats[i]. value
                };
            }
            serialized.stats = statsObj;
            
            // ⭐ 使用对象而不是数组存储 affixDetails
            if (item.affixDetails) {
                const affixObj: any = {};
                for (let i = 0; i < item.affixDetails.length; i++) {
                    const affix = item.affixDetails[i];
                    if (affix && affix.name) {
                        affixObj[i.toString()] = {
                            position: affix.position,
                            tier: affix. tier,
                            name: affix.name,
                            description: affix.description,
                            color: affix.color,
                        };
                    }
                }
                serialized. affixDetails = affixObj;
            }
            
            serializedItems[idx. toString()] = serialized;
        }
        
        const serializedEquipment: any = {};
        for (const slot in equipment) {
            const item = equipment[slot];
            if (item) {
                const serialized: any = {
                    name: item.name,
                    type: item.type,
                    icon: item.icon,
                    rarity: item.rarity,
                };
                
                // ⭐ 使用对象存储 stats
                const statsObj: any = {};
                for (let i = 0; i < item.stats.length; i++) {
                    statsObj[i.toString()] = {
                        attribute: item.stats[i].attribute,
                        value: item.stats[i].value
                    };
                }
                serialized.stats = statsObj;
                
                // ⭐ 使用对象存储 affixDetails
                if (item.affixDetails) {
                    const affixObj: any = {};
                    for (let i = 0; i < item.affixDetails.length; i++) {
                        const affix = item.affixDetails[i];
                        if (affix && affix.name) {
                            affixObj[i.toString()] = {
                                position: affix.position,
                                tier: affix. tier,
                                name: affix.name,
                                description: affix.description,
                                color: affix.color,
                            };
                        }
                    }
                    serialized.affixDetails = affixObj;
                }
                
                serializedEquipment[slot] = serialized;
            } else {
                serializedEquipment[slot] = null;
            }
        }
        
        print(`[EquipmentVaultSystem] 💾 保存到存储: ${items.length} 件仓库装备`);
        
        CustomNetTables.SetTableValue("player_vaults", playerId. toString(), {
            items: serializedItems,
            equipment: serializedEquipment,
            timestamp: Time()
        } as any);
    }

    // ⭐ 持久化加载（修复版 - 确保 affixDetails 一定是数组）
    private static LoadFromPersistentStorage(playerId: PlayerID): void {
        const data = CustomNetTables.GetTableValue("player_vaults", playerId.toString()) as any;
        
        if (data) {
            if (data.items) {
                const items: ExternalRewardItem[] = [];
                for (const key in data.items) {
                    const item = data.items[key];
                    
                    // ⭐ 安全转换 stats（确保是数组）
                    let statsArray: any[] = [];
                    if (item.stats) {
                        if (Array.isArray(item.stats)) {
                            statsArray = item.stats;
                        } else {
                            for (const k in item.stats) {
                                const stat = item.stats[k];
                                if (stat && stat.attribute) {
                                    statsArray.push(stat);
                                }
                            }
                        }
                    }
                    
                    // ⭐ 安全转换 affixDetails（确保是数组）
                    let affixDetailsArray: any[] | undefined = undefined;
                    if (item.affixDetails) {
                        const tempArr: any[] = [];
                        
                        if (Array.isArray(item. affixDetails)) {
                            // 已经是数组，直接复制
                            for (let i = 0; i < item. affixDetails.length; i++) {
                                if (item.affixDetails[i] && item.affixDetails[i].name) {
                                    tempArr.push(item. affixDetails[i]);
                                }
                            }
                        } else if (typeof item. affixDetails === 'object') {
                            // 是对象，转成数组
                            for (const k in item.affixDetails) {
                                const affix = item.affixDetails[k];
                                if (affix && affix.name) {
                                    tempArr.push(affix);
                                }
                            }
                        }
                        
                        if (tempArr.length > 0) {
                            affixDetailsArray = tempArr;
                            print(`[EquipmentVaultSystem] ✓ 加载仓库装备 ${item. name}，词缀: ${tempArr.length} 个`);
                        }
                    }
                    
                    items.push({ 
                        name: item.name, 
                        type: item.type, 
                        icon: item.icon, 
                        stats: statsArray,
                        rarity: item.rarity,
                        affixDetails: affixDetailsArray,
                    });
                }
                this.playerVaults[playerId] = items;
                print(`[EquipmentVaultSystem] 从存储加载了 ${items.length} 件仓库装备`);
            }
            
            if (data.equipment) {
                const equipment: { [slot: string]: ExternalRewardItem | null } = {};
                for (const slot in data.equipment) {
                    const item = data.equipment[slot];
                    if (item) {
                        // ⭐ 安全转换 stats
                        let statsArray: any[] = [];
                        if (item.stats) {
                            if (Array. isArray(item.stats)) {
                                statsArray = item. stats;
                            } else {
                                for (const k in item.stats) {
                                    const stat = item.stats[k];
                                    if (stat && stat.attribute) {
                                        statsArray.push(stat);
                                    }
                                }
                            }
                        }
                        
                        // ⭐ 安全转换 affixDetails
                        let affixDetailsArray: any[] | undefined = undefined;
                        if (item.affixDetails) {
                            const tempArr: any[] = [];
                            
                            if (Array.isArray(item.affixDetails)) {
                                for (let i = 0; i < item.affixDetails.length; i++) {
                                    if (item.affixDetails[i] && item.affixDetails[i].name) {
                                        tempArr.push(item.affixDetails[i]);
                                    }
                                }
                            } else if (typeof item.affixDetails === 'object') {
                                for (const k in item.affixDetails) {
                                    const affix = item.affixDetails[k];
                                    if (affix && affix.name) {
                                        tempArr. push(affix);
                                    }
                                }
                            }
                            
                            if (tempArr.length > 0) {
                                affixDetailsArray = tempArr;
                                print(`[EquipmentVaultSystem] ✓ 加载装备槽 ${slot}: ${item. name}，词缀: ${tempArr.length} 个`);
                            }
                        }
                        
                        equipment[slot] = { 
                            name: item.name, 
                            type: item.type, 
                            icon: item.icon, 
                            stats: statsArray,
                            rarity: item.rarity,
                            affixDetails: affixDetailsArray,
                        };
                    } else {
                        equipment[slot] = null;
                    }
                }
                this.playerEquipment[playerId] = equipment;
                
                let equipCount = 0;
                for (const slot in equipment) {
                    if (equipment[slot]) equipCount++;
                }
                print(`[EquipmentVaultSystem] 从存储加载了 ${equipCount} 件已装备装备`);
            }
        } else {
            this.playerVaults[playerId] = [];
            print(`[EquipmentVaultSystem] 玩家${playerId}没有存储数据，初始化空仓库`);
        }
    }
}