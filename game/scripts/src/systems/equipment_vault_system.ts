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
    "饰品": EquipmentSlot. TRINKET,
    "武器": EquipmentSlot. WEAPON,
    "护甲": EquipmentSlot.ARMOR,
    "腰带": EquipmentSlot.BELT,
    "鞋子": EquipmentSlot.BOOTS,
};

export class EquipmentVaultSystem {
    private static playerVaults: { [playerId: number]: ExternalRewardItem[] } = {};
    private static playerEquipment: { [playerId: number]: { [slot: string]: ExternalRewardItem | null } } = {};

    // 初始化玩家仓库和装备
    static InitializePlayer(playerId: PlayerID): void {
        print(`[EquipmentVaultSystem] 初始化玩家${playerId}的仓库和装备`);
        
        // 初始化装备槽
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
        
        // 从持久化存储加载
        this.LoadFromPersistentStorage(playerId);
    }

    // 保存装备到仓库
    static SaveToVault(playerId: PlayerID, item: ExternalRewardItem): void {
        print(`[EquipmentVaultSystem] 保存玩家${playerId}获得的装备：${item.name}`);
        
        if (!this.playerVaults[playerId]) {
            this.playerVaults[playerId] = [];
        }
        
        this.playerVaults[playerId].push(item);
        
        // 持久化保存
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
    
    // 确定装备槽位
    const slot = ITEM_TYPE_TO_SLOT[item. type];
    if (! slot) {
        print(`[EquipmentVaultSystem] ❌ 未知的装备类型：${item. type}`);
        return false;
    }
    
    // ⭐ 先从仓库移除新装备
    vault.splice(index, 1);
    print(`[EquipmentVaultSystem] 从仓库移除：${item.name}，剩余 ${vault.length} 件`);
    
    // ⭐ 检查槽位是否已有装备
    const equipment = this.GetEquipment(playerId);
    if (equipment[slot]) {
        const oldItem = equipment[slot]! ;
        print(`[EquipmentVaultSystem] ${slot} 槽位已有装备：${oldItem.name}，卸下旧装备`);
        
        // 移除旧装备属性
        EquipmentVaultSystem.RemoveEquipmentStats(playerId, oldItem);
        
        // 放回仓库
        vault.push(oldItem);
        print(`[EquipmentVaultSystem] 旧装备放回仓库，现有 ${vault.length} 件`);
    }
    
    // 装备到槽位
    equipment[slot] = item;
    
    // 应用新装备属性
    EquipmentVaultSystem.ApplyEquipmentStats(playerId, item);
    
    // 持久化保存
    EquipmentVaultSystem.SaveToPersistentStorage(playerId);
    
    print(`[EquipmentVaultSystem] ✓ 玩家${playerId}装备了：${item.name} 到槽位 ${slot}`);
    
    // 通知客户端更新装备界面
    EquipmentVaultSystem.SendEquipmentUpdate(playerId);
    
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
        
        // 移除装备属性
        this.RemoveEquipmentStats(playerId, item);
        
        // 放回仓库
        this.SaveToVault(playerId, item);
        
        // 清空槽位
        equipment[slot] = null;
        
        // 持久化保存
        this. SaveToPersistentStorage(playerId);
        
        print(`[EquipmentVaultSystem] ✓ 玩家${playerId}卸下了：${item.name}`);
        
        // 通知客户端更新装备界面
        this.SendEquipmentUpdate(playerId);
        
        return true;
    }

    // 应用装备属性到英雄（支持多属性）
    private static ApplyEquipmentStats(playerId: PlayerID, item: ExternalRewardItem): void {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (! hero) {
            print(`[EquipmentVaultSystem] ❌ 找不到英雄`);
            return;
        }
        
        print(`[EquipmentVaultSystem] 应用装备：${item.name}`);
        
        // 遍历所有属性
        item.stats.forEach(stat => {
            print(`[EquipmentVaultSystem]   +${stat.value} ${stat.attribute}`);
            
            switch (stat.attribute) {
                case EquipmentAttribute. STRENGTH:
                    hero.SetBaseStrength(hero.GetBaseStrength() + stat.value);
                    break;
                case EquipmentAttribute.AGILITY:
                    hero.SetBaseAgility(hero.GetBaseAgility() + stat.value);
                    break;
                case EquipmentAttribute.INTELLIGENCE:
                    hero.SetBaseIntellect(hero.GetBaseIntellect() + stat.value);
                    break;
                case EquipmentAttribute.ARMOR:
                    hero.SetPhysicalArmorBaseValue(hero.GetPhysicalArmorBaseValue() + stat. value);
                    break;
                case EquipmentAttribute. HEALTH:
                    hero. SetMaxHealth(hero.GetMaxHealth() + stat.value);
                    hero.SetHealth(hero.GetHealth() + stat.value);
                    break;
                case EquipmentAttribute.MANA:
                    hero.SetMaxMana(hero.GetMaxMana() + stat.value);
                    hero.SetMana(hero.GetMana() + stat.value);
                    break;
                case EquipmentAttribute.ATTACK_DAMAGE:
                    hero.SetBaseDamageMin(hero.GetBaseDamageMin() + stat.value);
                    hero.SetBaseDamageMax(hero.GetBaseDamageMax() + stat.value);
                    break;
                case EquipmentAttribute. MOVE_SPEED:
                    hero.SetBaseMoveSpeed(hero.GetBaseMoveSpeed() + stat.value);
                    break;
                case EquipmentAttribute. MAGIC_RESISTANCE:
                    hero.SetBaseMagicalResistanceValue(hero.GetBaseMagicalResistanceValue() + stat. value);
                    break;
                case EquipmentAttribute.ATTACK_SPEED:
                    print(`[EquipmentVaultSystem] ⚠️ 攻击速度需要通过 Modifier 实现`);
                    break;
                default:
                    print(`[EquipmentVaultSystem] ⚠️ 未知的属性类型：${stat.attribute}`);
            }
        });
    }

    // 移除装备属性（支持多属性）
    private static RemoveEquipmentStats(playerId: PlayerID, item: ExternalRewardItem): void {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) {
            print(`[EquipmentVaultSystem] ❌ 找不到英雄`);
            return;
        }
        
        print(`[EquipmentVaultSystem] 移除装备：${item.name}`);
        
        // 遍历所有属性
        item.stats. forEach(stat => {
            print(`[EquipmentVaultSystem]   -${stat.value} ${stat.attribute}`);
            
            switch (stat.attribute) {
                case EquipmentAttribute.STRENGTH:
                    hero.SetBaseStrength(hero.GetBaseStrength() - stat.value);
                    break;
                case EquipmentAttribute.AGILITY:
                    hero.SetBaseAgility(hero.GetBaseAgility() - stat.value);
                    break;
                case EquipmentAttribute.INTELLIGENCE:
                    hero.SetBaseIntellect(hero.GetBaseIntellect() - stat.value);
                    break;
                case EquipmentAttribute.ARMOR:
                    hero.SetPhysicalArmorBaseValue(hero.GetPhysicalArmorBaseValue() - stat.value);
                    break;
                case EquipmentAttribute.HEALTH:
                    const newMaxHealth = hero.GetMaxHealth() - stat.value;
                    hero.SetMaxHealth(newMaxHealth);
                    if (hero.GetHealth() > newMaxHealth) {
                        hero.SetHealth(newMaxHealth);
                    }
                    break;
                case EquipmentAttribute.MANA:
                    const newMaxMana = hero.GetMaxMana() - stat.value;
                    hero.SetMaxMana(newMaxMana);
                    if (hero.GetMana() > newMaxMana) {
                        hero.SetMana(newMaxMana);
                    }
                    break;
                case EquipmentAttribute.ATTACK_DAMAGE:
                    hero.SetBaseDamageMin(hero.GetBaseDamageMin() - stat.value);
                    hero.SetBaseDamageMax(hero.GetBaseDamageMax() - stat.value);
                    break;
                case EquipmentAttribute.MOVE_SPEED:
                    hero.SetBaseMoveSpeed(hero.GetBaseMoveSpeed() - stat.value);
                    break;
                case EquipmentAttribute.MAGIC_RESISTANCE:
                    hero.SetBaseMagicalResistanceValue(hero.GetBaseMagicalResistanceValue() - stat.value);
                    break;
                default:
                    print(`[EquipmentVaultSystem] ⚠️ 未知的属性类型：${stat.attribute}`);
            }
        });
    }

    // 发送装备更新到客户端
    private static SendEquipmentUpdate(playerId: PlayerID): void {
        const equipment = this.GetEquipment(playerId);
        const player = PlayerResource.GetPlayer(playerId);
        
        if (!player) return;
        
        // 转换为可序列化格式
        const serializedEquipment: any = {};
        for (const slot in equipment) {
            const item = equipment[slot];
            if (item) {
                serializedEquipment[slot] = {
                    name: item. name,
                    type: item.type,
                    icon: item.icon,
                    stats: item.stats. map(stat => ({
                        attribute: stat.attribute,
                        value: stat.value
                    }))
                };
            } else {
                serializedEquipment[slot] = null;
            }
        }
        
        (CustomGameEventManager.Send_ServerToPlayer as any)(player, 'update_equipment_ui', {
            equipment: serializedEquipment
        });
        
        print(`[EquipmentVaultSystem] 发送装备数据到客户端`);
    }

    // 持久化保存
    private static SaveToPersistentStorage(playerId: PlayerID): void {
        const items = this.playerVaults[playerId] || [];
        const equipment = this.playerEquipment[playerId] || {};
        
        print(`[EquipmentVaultSystem] ========== 开始持久化保存 ==========`);
        print(`[EquipmentVaultSystem] 玩家ID: ${playerId}`);
        print(`[EquipmentVaultSystem] 仓库装备数量: ${items.length}`);
        
        // 序列化仓库装备
        const serializedItems: any = {};
        items.forEach((item, index) => {
            serializedItems[index. toString()] = {
                name: item.name,
                type: item.type,
                icon: item.icon,
                stats: item.stats.map(stat => ({
                    attribute: stat.attribute,
                    value: stat.value
                }))
            };
        });
        
        // 序列化已装备物品
        const serializedEquipment: any = {};
        for (const slot in equipment) {
            const item = equipment[slot];
            if (item) {
                serializedEquipment[slot] = {
                    name: item.name,
                    type: item.type,
                    icon: item.icon,
                    stats: item.stats.map(stat => ({
                        attribute: stat.attribute,
                        value: stat.value
                    }))
                };
                print(`[EquipmentVaultSystem]   ${slot}: ${item.name}`);
            } else {
                serializedEquipment[slot] = null;
            }
        }
        
        const dataToSave = {
            items: serializedItems,
            equipment: serializedEquipment,
            timestamp: Time()
        };
        
        CustomNetTables.SetTableValue("player_vaults", playerId. toString(), dataToSave as any);
        print(`[EquipmentVaultSystem] ✓ 持久化保存完成`);
        print(`[EquipmentVaultSystem] ========================================`);
    }

    // 从持久化存储加载
    private static LoadFromPersistentStorage(playerId: PlayerID): void {
        print(`[EquipmentVaultSystem] ========== 开始加载持久化数据 ==========`);
        print(`[EquipmentVaultSystem] 玩家ID: ${playerId}`);
        
        const data = CustomNetTables.GetTableValue("player_vaults", playerId.toString()) as any;
        
        if (data) {
            // 加载仓库装备
          if (data.items) {
    const items: ExternalRewardItem[] = [];
    for (const key in data.items) {
        const item = data. items[key];
        
        // ⭐ 将 stats 对象转为数组
        let statsArray: any[] = [];
        if (item.stats) {
            if (Array.isArray(item.stats)) {
                statsArray = item. stats;
            } else {
                // 对象格式，转为数组
                statsArray = Object.values(item.stats);
            }
        }
        
        items.push({
            name: item.name,
            type: item.type,
            icon: item.icon,
            stats: statsArray  // ✅ 保证是数组
        });
    }
    this.playerVaults[playerId] = items;
    print(`[EquipmentVaultSystem] ✓ 加载了${items.length}件仓库装备`);
}
            
            // 加载已装备物品
            if (data.equipment) {
    const equipment: { [slot: string]: ExternalRewardItem | null } = {};
    for (const slot in data. equipment) {
        const item = data.equipment[slot];
        if (item) {
            // ⭐ 将 stats 对象转为数组
            let statsArray: any[] = [];
            if (item. stats) {
                if (Array.isArray(item.stats)) {
                    statsArray = item.stats;
                } else {
                    // 对象格式，转为数组
                    statsArray = Object.values(item.stats);
                }
            }
            
            equipment[slot] = {
                name: item.name,
                type: item.type,
                icon: item.icon,
                stats: statsArray  // ✅ 保证是数组
            };
            print(`[EquipmentVaultSystem]   ${slot}: ${item.name}`);
            
            // 重新应用装备属性
            this.ApplyEquipmentStats(playerId, equipment[slot]!);
        } else {
            equipment[slot] = null;
        }
    }
    this.playerEquipment[playerId] = equipment;
    print(`[EquipmentVaultSystem] ✓ 加载了已装备物品`);
}
        } else {
            print(`[EquipmentVaultSystem] 玩家${playerId}没有持久化数据，初始化空仓库`);
            this.playerVaults[playerId] = [];
        }
        
        print(`[EquipmentVaultSystem] ==========================================`);
    }
}