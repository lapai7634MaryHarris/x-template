/** @luaTable */
declare const _G: any;
import { ExternalRewardItem, ExternalItemType, EquipmentAttribute } from "../dungeon/external_reward_pool";

// 初始化全局装备属性表
_G.EquipmentStats = _G.EquipmentStats || {};

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
    "头盔": EquipmentSlot. HELMET,
    "项链": EquipmentSlot. NECKLACE,
    "戒指": EquipmentSlot. RING,
    "饰品": EquipmentSlot. TRINKET,
    "武器": EquipmentSlot.WEAPON,
    "护甲": EquipmentSlot. ARMOR,
    "腰带": EquipmentSlot. BELT,
    "鞋子": EquipmentSlot.BOOTS,
};

export class EquipmentVaultSystem {
    private static playerVaults: { [playerId: number]: ExternalRewardItem[] } = {};
    private static playerEquipment: { [playerId: number]: { [slot: string]: ExternalRewardItem | null } } = {};
    private static playerModifiers: { [playerId: number]: CDOTA_Buff } = {};
    private static playerBaseArmor: { [playerId: number]: number } = {};
    
    // 仓库最大容量限制
    private static readonly MAX_VAULT_SIZE = 50;
    
    // ⭐ 标记是否正在刷新属性（防止重入）
    private static isRefreshing: { [playerId: number]: boolean } = {};

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
        if (!this.playerVaults[playerId]) {
            this. playerVaults[playerId] = [];
        }
        
        // 从持久化存储加载
        this.LoadFromPersistentStorage(playerId);
        
        // 创建装备系统 Modifier
        if (IsServer()) {
            if (!hero) {
                hero = PlayerResource.GetSelectedHeroEntity(playerId) as CDOTA_BaseNPC_Hero;
            }
            
            if (! hero || hero.IsNull()) {
                print(`[EquipmentVaultSystem] ❌ 玩家${playerId}的英雄不存在`);
                return;
            }
            
            print(`[EquipmentVaultSystem] ✓ 找到玩家${playerId}的英雄：${hero.GetUnitName()}`);
            
            // 记录英雄的原始基础护甲（只记录一次）
            if (this.playerBaseArmor[playerId] === undefined) {
                this.playerBaseArmor[playerId] = hero.GetPhysicalArmorBaseValue();
                print(`[EquipmentVaultSystem] 📝 记录基础护甲: ${this.playerBaseArmor[playerId]}`);
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
            
            // 初始化全局属性表
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
            this. playerVaults[playerId] = [];
        }
        
        if (this.playerVaults[playerId]. length >= this.MAX_VAULT_SIZE) {
            print(`[EquipmentVaultSystem] ⚠️ 仓库已满（${this.MAX_VAULT_SIZE}件），无法添加`);
            return;
        }
        
        this.playerVaults[playerId].push(item);
        this.SaveToPersistentStorage(playerId);
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
        if (!this. playerEquipment[playerId]) {
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
            const oldItem = equipment[slot]!;
            print(`[EquipmentVaultSystem] ${slot} 槽位已有装备：${oldItem.name}，卸下旧装备`);
            vault.push(oldItem);
        }
        
        equipment[slot] = item;
        
        // ⭐ 刷新装备属性
        this. RefreshEquipmentStats(playerId);
        
        this.SaveToPersistentStorage(playerId);
        
        print(`[EquipmentVaultSystem] ✓ 玩家${playerId}装备了：${item.name} 到槽位 ${slot}`);
        return true;
    }

    // 卸下装备
    static UnequipItem(playerId: PlayerID, slot: string): boolean {
        const equipment = this. GetEquipment(playerId);
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
        
        // ⭐ 刷新装备属性
        this.RefreshEquipmentStats(playerId);
        
        this.SaveToPersistentStorage(playerId);
        
        print(`[EquipmentVaultSystem] ✓ 玩家${playerId}卸下了：${item. name}`);
        return true;
    }

    // ⭐⭐⭐ 刷新装备属性（安全版本 - 使用延迟重建避免竞态条件）
    private static RefreshEquipmentStats(playerId: PlayerID): void {
        if (! IsServer()) return;
        
        // ⭐ 防止重入
        if (this.isRefreshing[playerId]) {
            print(`[EquipmentVaultSystem] ⚠️ 正在刷新中，跳过`);
            return;
        }
        this.isRefreshing[playerId] = true;
        
        const equipment = this.GetEquipment(playerId);
        
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
        
        for (const slot in equipment) {
            const item = equipment[slot];
            if (item && item.stats) {
                for (let i = 0; i < item.stats. length; i++) {
                    const stat = item.stats[i];
                    if (stat && stat.attribute) {
                        const key = this.AttributeToKey(stat.attribute);
                        if (key) {
                            totalStats[key] = (totalStats[key] || 0) + stat.value;
                        }
                    }
                }
            }
        }
        
        // 更新全局属性表
        _G. EquipmentStats[playerId] = totalStats;
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId) as CDOTA_BaseNPC_Hero;
        if (! hero || hero.IsNull()) {
            this.isRefreshing[playerId] = false;
            return;
        }
        
        // 设置护甲
        const baseArmor = this.playerBaseArmor[playerId] || 0;
        const newArmor = baseArmor + totalStats.armor;
        hero.SetPhysicalArmorBaseValue(newArmor);
        
        // ⭐ 移除旧的 modifier
        const existingModifier = hero.FindModifierByName("modifier_equipment_system");
        if (existingModifier && !existingModifier.IsNull()) {
            existingModifier. Destroy();
            this.playerModifiers[playerId] = undefined as any;
        }
        
        // ⭐⭐⭐ 关键修复：延迟创建新的 modifier，避免同一帧内的竞态条件
        Timers.CreateTimer(0.1, () => {
            // 重置刷新标记
            this.isRefreshing[playerId] = false;
            
            if (! IsServer()) return undefined;
            
            const heroCheck = PlayerResource.GetSelectedHeroEntity(playerId) as CDOTA_BaseNPC_Hero;
            if (!heroCheck || heroCheck.IsNull()) {
                return undefined;
            }
            
            // 确保全局属性表是最新的
            _G.EquipmentStats[playerId] = totalStats;
            
            // 检查是否已经有 modifier（防止重复创建）
            const checkModifier = heroCheck.FindModifierByName("modifier_equipment_system");
            if (checkModifier && !checkModifier.IsNull()) {
                this.playerModifiers[playerId] = checkModifier;
                return undefined;
            }
            
            // 创建新的 modifier
            const newModifier = heroCheck.AddNewModifier(heroCheck, undefined, "modifier_equipment_system", {});
            if (newModifier && !newModifier. IsNull()) {
                this.playerModifiers[playerId] = newModifier;
            }
            
            return undefined;
        });
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

    // 持久化保存
    private static SaveToPersistentStorage(playerId: PlayerID): void {
        const items = this.playerVaults[playerId] || [];
        const equipment = this.playerEquipment[playerId] || {};
        
        const itemsToSave = items.slice(0, this.MAX_VAULT_SIZE);
        
        const serializedItems: any = {};
        
        for (let idx = 0; idx < itemsToSave.length; idx++) {
            const item = itemsToSave[idx];
            const serialized: any = {
                name: item.name,
                type: item.type,
                icon: item.icon,
                rarity: item.rarity,
            };
            
            const statsObj: any = {};
            if (item.stats) {
                for (let i = 0; i < item.stats.length; i++) {
                    statsObj[i. toString()] = {
                        attribute: item.stats[i].attribute,
                        value: item.stats[i]. value
                    };
                }
            }
            serialized.stats = statsObj;
            
            if (item.affixDetails) {
                const affixObj: any = {};
                const maxAffixes = Math.min(item. affixDetails.length, 6);
                for (let i = 0; i < maxAffixes; i++) {
                    const affix = item.affixDetails[i];
                    if (affix && affix.name) {
                        affixObj[i.toString()] = {
                            position: affix.position,
                            tier: affix.tier,
                            name: affix.name,
                            description: affix.description,
                            color: affix.color,
                        };
                    }
                }
                serialized.affixDetails = affixObj;
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
                
                const statsObj: any = {};
                if (item.stats) {
                    for (let i = 0; i < item.stats.length; i++) {
                        statsObj[i.toString()] = {
                            attribute: item.stats[i].attribute,
                            value: item.stats[i].value
                        };
                    }
                }
                serialized.stats = statsObj;
                
                if (item.affixDetails) {
                    const affixObj: any = {};
                    const maxAffixes = Math.min(item.affixDetails.length, 6);
                    for (let i = 0; i < maxAffixes; i++) {
                        const affix = item.affixDetails[i];
                        if (affix && affix.name) {
                            affixObj[i. toString()] = {
                                position: affix.position,
                                tier: affix.tier,
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
        
        print(`[EquipmentVaultSystem] 💾 保存到存储: ${itemsToSave. length} 件仓库装备`);
        
        CustomNetTables.SetTableValue("player_vaults", playerId. toString(), {
            items: serializedItems,
            equipment: serializedEquipment,
            timestamp: Time()
        } as any);
    }

    // 持久化加载
    private static LoadFromPersistentStorage(playerId: PlayerID): void {
        const data = CustomNetTables.GetTableValue("player_vaults", playerId.toString()) as any;
        
        if (data) {
            if (data.items) {
                const items: ExternalRewardItem[] = [];
                for (const key in data.items) {
                    const item = data.items[key];
                    
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
                                const affix = item. affixDetails[k];
                                if (affix && affix.name) {
                                    tempArr.push(affix);
                                }
                            }
                        }
                        
                        if (tempArr.length > 0) {
                            affixDetailsArray = tempArr;
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
                    const item = data. equipment[slot];
                    if (item) {
                        let statsArray: any[] = [];
                        if (item.stats) {
                            if (Array.isArray(item.stats)) {
                                statsArray = item. stats;
                            } else {
                                for (const k in item.stats) {
                                    const stat = item. stats[k];
                                    if (stat && stat.attribute) {
                                        statsArray.push(stat);
                                    }
                                }
                            }
                        }
                        
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
                                    if (affix && affix. name) {
                                        tempArr. push(affix);
                                    }
                                }
                            }
                            
                            if (tempArr.length > 0) {
                                affixDetailsArray = tempArr;
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