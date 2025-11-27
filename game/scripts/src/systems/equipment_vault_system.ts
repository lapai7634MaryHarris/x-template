import { ExternalRewardItem } from "../dungeon/external_reward_pool";

// 装备槽位枚举
export enum EquipmentSlot {
    HELMET = 'helmet',      // 头盔
    NECKLACE = 'necklace',  // 项链
    RING = 'ring',          // 戒指
    TRINKET = 'trinket',    // 饰品
    WEAPON = 'weapon',      // 武器
    ARMOR = 'armor',        // 护甲
    BELT = 'belt',          // 腰带
    BOOTS = 'boots',        // 鞋子
}

// 装备类型映射到槽位
const ITEM_TYPE_TO_SLOT: { [key: string]: EquipmentSlot } = {
    "头盔": EquipmentSlot.HELMET,
    "项链": EquipmentSlot.NECKLACE,
    "戒指": EquipmentSlot.RING,
    "饰品": EquipmentSlot.TRINKET,
    "武器": EquipmentSlot. WEAPON,
    "护甲": EquipmentSlot. ARMOR,
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
        this. SaveToPersistentStorage(playerId);
    }

    // 获取玩家仓库
    static GetVault(playerId: PlayerID): ExternalRewardItem[] {
        if (!this.playerVaults[playerId]) {
            this. InitializePlayer(playerId);
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
        const slot = ITEM_TYPE_TO_SLOT[item.type];
        if (! slot) {
            print(`[EquipmentVaultSystem] ❌ 未知的装备类型：${item. type}`);
            return false;
        }
        
        // 检查槽位是否已有装备
        const equipment = this.GetEquipment(playerId);
        if (equipment[slot]) {
            print(`[EquipmentVaultSystem] ${slot} 槽位已有装备：${equipment[slot]! .name}，先卸下旧装备`);
            this.UnequipItem(playerId, slot);
        }
        
        // 装备到槽位
        equipment[slot] = item;
        
        // 应用装备属性
        this.ApplyEquipmentStats(playerId, item);
        
        // 从仓库移除
        vault.splice(index, 1);
        
        // 持久化保存
        this.SaveToPersistentStorage(playerId);
        
        print(`[EquipmentVaultSystem] ✓ 玩家${playerId}装备了：${item.name} 到槽位 ${slot}`);
        
        // 通知客户端更新装备界面
        this.SendEquipmentUpdate(playerId);
        
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

    // 应用装备属性到英雄
    private static ApplyEquipmentStats(playerId: PlayerID, item: ExternalRewardItem): void {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (! hero) {
            print(`[EquipmentVaultSystem] ❌ 找不到英雄`);
            return;
        }
        
        print(`[EquipmentVaultSystem] 应用属性：${item.name} - ${item.attribute} +${item.value}`);
        
        switch (item.attribute) {
            case "力量":
            case "Strength":
                hero.SetBaseStrength(hero.GetBaseStrength() + item.value);
                break;
            case "敏捷":
            case "Agility":
                hero.SetBaseAgility(hero.GetBaseAgility() + item.value);
                break;
            case "智力":
            case "Intelligence":
                hero.SetBaseIntellect(hero.GetBaseIntellect() + item.value);
                break;
            case "护甲":
            case "Armor":
                hero.SetPhysicalArmorBaseValue(hero.GetPhysicalArmorBaseValue() + item. value);
                break;
            case "生命":
            case "Health":
                hero.SetMaxHealth(hero.GetMaxHealth() + item.value);
                hero.SetHealth(hero.GetHealth() + item.value);
                break;
            case "魔法":
            case "Mana":
                hero.SetMaxMana(hero.GetMaxMana() + item.value);
                hero.SetMana(hero.GetMana() + item.value);
                break;
            default:
                print(`[EquipmentVaultSystem] ⚠️ 未知的属性类型：${item.attribute}`);
        }
    }

    // 移除装备属性
    private static RemoveEquipmentStats(playerId: PlayerID, item: ExternalRewardItem): void {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (! hero) {
            print(`[EquipmentVaultSystem] ❌ 找不到英雄`);
            return;
        }
        
        print(`[EquipmentVaultSystem] 移除属性：${item.name} - ${item.attribute} -${item.value}`);
        
        switch (item.attribute) {
            case "力量":
            case "Strength":
                hero.SetBaseStrength(hero.GetBaseStrength() - item.value);
                break;
            case "敏捷":
            case "Agility":
                hero.SetBaseAgility(hero.GetBaseAgility() - item.value);
                break;
            case "智力":
            case "Intelligence":
                hero.SetBaseIntellect(hero.GetBaseIntellect() - item.value);
                break;
            case "护甲":
            case "Armor":
                hero.SetPhysicalArmorBaseValue(hero. GetPhysicalArmorBaseValue() - item.value);
                break;
            case "生命":
            case "Health":
                const newMaxHealth = hero.GetMaxHealth() - item.value;
                hero. SetMaxHealth(newMaxHealth);
                if (hero.GetHealth() > newMaxHealth) {
                    hero.SetHealth(newMaxHealth);
                }
                break;
            case "魔法":
            case "Mana":
                const newMaxMana = hero.GetMaxMana() - item.value;
                hero. SetMaxMana(newMaxMana);
                if (hero. GetMana() > newMaxMana) {
                    hero. SetMana(newMaxMana);
                }
                break;
            default:
                print(`[EquipmentVaultSystem] ⚠️ 未知的属性类型：${item.attribute}`);
        }
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
                    attribute: item.attribute,
                    value: item.value
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
                attribute: item.attribute,
                value: item.value
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
                    attribute: item.attribute,
                    value: item.value
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
        
        CustomNetTables.SetTableValue("player_vaults", playerId.toString(), dataToSave as any);
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
                    const item = data.items[key];
                    items.push({
                        name: item.name,
                        type: item.type,
                        icon: item.icon,
                        attribute: item.attribute,
                        value: item.value
                    });
                }
                this.playerVaults[playerId] = items;
                print(`[EquipmentVaultSystem] ✓ 加载了${items.length}件仓库装备`);
            }
            
            // 加载已装备物品
            if (data.equipment) {
                const equipment: { [slot: string]: ExternalRewardItem | null } = {};
                for (const slot in data.equipment) {
                    const item = data. equipment[slot];
                    if (item) {
                        equipment[slot] = {
                            name: item.name,
                            type: item.type,
                            icon: item.icon,
                            attribute: item.attribute,
                            value: item. value
                        };
                        print(`[EquipmentVaultSystem]   ${slot}: ${item.name}`);
                        
                        // 重新应用装备属性
                        this. ApplyEquipmentStats(playerId, equipment[slot]!);
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