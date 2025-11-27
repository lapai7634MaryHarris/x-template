import { ExternalRewardItem, ExternalItemType, EquipmentAttribute } from "../dungeon/external_reward_pool";

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
    private static modifierLoadAttempted: boolean = false;

    // 初始化玩家仓库和装备
    static InitializePlayer(playerId: PlayerID): void {
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
        
        // 从持久化存储加载
        this.LoadFromPersistentStorage(playerId);
        
        // 创建装备系统 Modifier
        if (IsServer()) {
            // ⭐ 第一次初始化时，尝试加载 Modifier 文件
            if (!this. modifierLoadAttempted) {
                this.modifierLoadAttempted = true;
                print('[EquipmentVaultSystem] 尝试加载 modifier_equipment_system.lua.. .');
                
                // 使用 pcall 安全调用，避免崩溃
                const [success, error] = pcall(() => {
                    // 使用 DoIncludeScript 加载文件（只传 1 个参数）
                    (globalThis as any).DoIncludeScript("modifiers/modifier_equipment_system.lua");
                });
                
                if (success) {
                    print('[EquipmentVaultSystem] ✓ 已加载 modifier_equipment_system.lua');
                } else {
                    print('[EquipmentVaultSystem] ⚠️ 加载失败（可能已经加载过）:');
                    print(error);
                }
            }
            
            const hero = PlayerResource. GetSelectedHeroEntity(playerId);
            if (hero) {
                // 尝试创建 Modifier
                const [success, modifier] = pcall(() => {
                    return hero.AddNewModifier(hero, undefined, "modifier_equipment_system", {});
                });
                
                if (success && modifier && !modifier.IsNull()) {
                    this.playerModifiers[playerId] = modifier;
                    print(`[EquipmentVaultSystem] ✓ 为玩家${playerId}创建装备系统 Modifier`);
                    
                    // 刷新装备属性
                    this. RefreshEquipmentStats(playerId);
                } else {
                    print(`[EquipmentVaultSystem] ❌ 创建 Modifier 失败`);
                    print(`[EquipmentVaultSystem] 原因: ${modifier}`);
                }
            }
        }
    }

    // 保存装备到仓库
    static SaveToVault(playerId: PlayerID, item: ExternalRewardItem): void {
        print(`[EquipmentVaultSystem] 保存玩家${playerId}获得的装备：${item.name}`);
        
        if (! this.playerVaults[playerId]) {
            this.playerVaults[playerId] = [];
        }
        
        this.playerVaults[playerId].push(item);
        this.SaveToPersistentStorage(playerId);
    }

    // 获取玩家仓库
    static GetVault(playerId: PlayerID): ExternalRewardItem[] {
        if (!this.playerVaults[playerId]) {
            this.InitializePlayer(playerId);
        }
        return this.playerVaults[playerId] || [];
    }

    // 获取玩家装备
    static GetEquipment(playerId: PlayerID): { [slot: string]: ExternalRewardItem | null } {
        if (!this.playerEquipment[playerId]) {
            this.InitializePlayer(playerId);
        }
        return this. playerEquipment[playerId];
    }

    // 从仓库装备物品
    static EquipItem(playerId: PlayerID, index: number): boolean {
        const vault = this. GetVault(playerId);
        
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
        
        this.SaveToVault(playerId, item);
        equipment[slot] = null;
        this.RefreshEquipmentStats(playerId);
        this. SaveToPersistentStorage(playerId);
        
        print(`[EquipmentVaultSystem] ✓ 玩家${playerId}卸下了：${item.name}`);
        return true;
    }

    // 刷新装备属性（核心方法）
    private static RefreshEquipmentStats(playerId: PlayerID): void {
        const equipment = this.GetEquipment(playerId);
        const modifier = this.playerModifiers[playerId];
        
        if (! modifier || modifier.IsNull()) {
            print(`[EquipmentVaultSystem] ❌ 找不到装备系统 Modifier`);
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
            status_resistance: 0,
        };
        
        print(`[EquipmentVaultSystem] 开始计算装备属性总和... `);
        
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
        
        // 调用 Modifier 的 UpdateStats 方法
        (modifier as any).UpdateStats(totalStats);
        
        print(`[EquipmentVaultSystem] ========== 装备属性总和 ==========`);
        print(`[EquipmentVaultSystem] 力量: +${totalStats.strength}`);
        print(`[EquipmentVaultSystem] 敏捷: +${totalStats.agility}`);
        print(`[EquipmentVaultSystem] 智力: +${totalStats.intelligence}`);
        print(`[EquipmentVaultSystem] 护甲: +${totalStats.armor}`);
        print(`[EquipmentVaultSystem] =====================================`);
    }

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
            "属性抗性": "status_resistance",
        };
        return mapping[attribute] || null;
    }

    private static SaveToPersistentStorage(playerId: PlayerID): void {
        const items = this.playerVaults[playerId] || [];
        const equipment = this.playerEquipment[playerId] || {};
        
        const serializedItems: any = {};
        items.forEach((item, index) => {
            serializedItems[index. toString()] = {
                name: item.name,
                type: item.type,
                icon: item.icon,
                stats: item.stats. map(stat => ({ attribute: stat.attribute, value: stat.value }))
            };
        });
        
        const serializedEquipment: any = {};
        for (const slot in equipment) {
            const item = equipment[slot];
            serializedEquipment[slot] = item ? {
                name: item. name,
                type: item. type,
                icon: item. icon,
                stats: item. stats.map(stat => ({ attribute: stat.attribute, value: stat.value }))
            } : null;
        }
        
        CustomNetTables.SetTableValue("player_vaults", playerId. toString(), {
            items: serializedItems,
            equipment: serializedEquipment,
            timestamp: Time()
        } as any);
    }

    private static LoadFromPersistentStorage(playerId: PlayerID): void {
        const data = CustomNetTables.GetTableValue("player_vaults", playerId.toString()) as any;
        
        if (data) {
            if (data.items) {
                const items: ExternalRewardItem[] = [];
                for (const key in data.items) {
                    const item = data.items[key];
                    let statsArray = Array.isArray(item.stats) ? item.stats : Object.values(item.stats);
                    items.push({ name: item.name, type: item.type, icon: item.icon, stats: statsArray });
                }
                this.playerVaults[playerId] = items;
            }
            
            if (data.equipment) {
                const equipment: { [slot: string]: ExternalRewardItem | null } = {};
                for (const slot in data.equipment) {
                    const item = data.equipment[slot];
                    if (item) {
                        let statsArray = Array.isArray(item.stats) ? item.stats : Object.values(item.stats);
                        equipment[slot] = { name: item.name, type: item.type, icon: item.icon, stats: statsArray };
                    } else {
                        equipment[slot] = null;
                    }
                }
                this.playerEquipment[playerId] = equipment;
            }
        } else {
            this.playerVaults[playerId] = [];
        }
    }
}