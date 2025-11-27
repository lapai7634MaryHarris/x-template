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
    "护甲": EquipmentSlot. ARMOR,
    "腰带": EquipmentSlot. BELT,
    "鞋子": EquipmentSlot. BOOTS,
};

export class EquipmentVaultSystem {
    private static playerVaults: { [playerId: number]: ExternalRewardItem[] } = {};
    private static playerEquipment: { [playerId: number]: { [slot: string]: ExternalRewardItem | null } } = {};
    private static playerModifiers: { [playerId: number]: CDOTA_Buff } = {};

    // 初始化玩家仓库和装备
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
    
    // 创建装备系统 Modifier
    if (IsServer()) {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) {
            // 检查 Modifier 是否已存在
            let modifier = this.playerModifiers[playerId];
            
            // 如果不存在或已失效，尝试创建新的
            if (!modifier || modifier.IsNull()) {
                try {
                    modifier = hero.AddNewModifier(hero, undefined, "modifier_equipment_system", {});
                    
                    if (modifier && ! modifier.IsNull()) {
                        this.playerModifiers[playerId] = modifier;
                        print(`[EquipmentVaultSystem] ✓ 为玩家${playerId}创建装备系统 Modifier`);
                        
                        // 刷新装备属性
                        this.RefreshEquipmentStats(playerId);
                    } else {
                        print(`[EquipmentVaultSystem] ❌ 创建 Modifier 失败`);
                        print(`[EquipmentVaultSystem] 提示: 需要确保 modifier_equipment_system. lua 已被加载`);
                        print(`[EquipmentVaultSystem] 解决方法: 在 addon_game_mode.lua 中添加 require('modifiers/modifier_equipment_system')`);
                    }
                } catch (error) {
                    print(`[EquipmentVaultSystem] ❌ 创建 Modifier 时发生异常:`);
                    print(error);
                }
            } else {
                print(`[EquipmentVaultSystem] ✓ 玩家${playerId}的 Modifier 已存在，刷新属性`);
                // Modifier 已存在，直接刷新
                this.RefreshEquipmentStats(playerId);
            }
        } else {
            print(`[EquipmentVaultSystem] ⚠️ 找不到玩家${playerId}的英雄实体`);
        }
    }
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
        const slot = ITEM_TYPE_TO_SLOT[item.type];
        if (!slot) {
            print(`[EquipmentVaultSystem] ❌ 未知的装备类型：${item.type}`);
            return false;
        }
        
        // 从仓库移除
        vault.splice(index, 1);
        print(`[EquipmentVaultSystem] 从仓库移除：${item.name}，剩余 ${vault.length} 件`);
        
        // 检查槽位是否已有装备
        const equipment = this.GetEquipment(playerId);
        if (equipment[slot]) {
            const oldItem = equipment[slot]!;
            print(`[EquipmentVaultSystem] ${slot} 槽位已有装备：${oldItem.name}，卸下旧装备`);
            
            // 放回仓库
            vault.push(oldItem);
            print(`[EquipmentVaultSystem] 旧装备放回仓库，现有 ${vault.length} 件`);
        }
        
        // 装备到槽位
        equipment[slot] = item;
        
        // 刷新装备属性
        this.RefreshEquipmentStats(playerId);
        
        // 持久化保存
        this. SaveToPersistentStorage(playerId);
        
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
        
        // 放回仓库
        this.SaveToVault(playerId, item);
        
        // 清空槽位
        equipment[slot] = null;
        
        // 刷新装备属性
        this.RefreshEquipmentStats(playerId);
        
        // 持久化保存
        this.SaveToPersistentStorage(playerId);
        
        print(`[EquipmentVaultSystem] ✓ 玩家${playerId}卸下了：${item.name}`);
        
        // 通知客户端更新装备界面
        this.SendEquipmentUpdate(playerId);
        
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
        
        // 累加所有装备的属性
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
        
        print(`[EquipmentVaultSystem] 开始计算装备属性总和...`);
        
        // 遍历所有槽位的装备
        for (const slot in equipment) {
            const item = equipment[slot];
            if (item) {
                print(`[EquipmentVaultSystem]   槽位 ${slot}: ${item.name}`);
                
                // 遍历装备的所有属性
                item.stats.forEach(stat => {
                    const key = this.AttributeToKey(stat.attribute);
                    if (key) {
                        totalStats[key] = (totalStats[key] || 0) + stat.value;
                        print(`[EquipmentVaultSystem]     +${stat.value} ${stat.attribute} (${key})`);
                    } else {
                        print(`[EquipmentVaultSystem]     ⚠️ 未知属性：${stat.attribute}`);
                    }
                });
            }
        }
        
        // 更新 Modifier
        (modifier as any).UpdateStats(totalStats);
        
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
    }

    // 属性名映射
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
                    name: item.name,
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
                    const item = data.items[key];
                    
                    // 将 stats 对象转为数组
                    let statsArray: any[] = [];
                    if (item.stats) {
                        if (Array.isArray(item.stats)) {
                            statsArray = item.stats;
                        } else {
                            statsArray = Object.values(item.stats);
                        }
                    }
                    
                    items.push({
                        name: item. name,
                        type: item.type,
                        icon: item.icon,
                        stats: statsArray
                    });
                }
                this.playerVaults[playerId] = items;
                print(`[EquipmentVaultSystem] ✓ 加载了${items.length}件仓库装备`);
            }
            
            // 加载已装备物品
            if (data.equipment) {
                const equipment: { [slot: string]: ExternalRewardItem | null } = {};
                for (const slot in data.equipment) {
                    const item = data.equipment[slot];
                    if (item) {
                        // 将 stats 对象转为数组
                        let statsArray: any[] = [];
                        if (item.stats) {
                            if (Array.isArray(item.stats)) {
                                statsArray = item.stats;
                            } else {
                                statsArray = Object.values(item.stats);
                            }
                        }
                        
                        equipment[slot] = {
                            name: item.name,
                            type: item. type,
                            icon: item.icon,
                            stats: statsArray
                        };
                        print(`[EquipmentVaultSystem]   ${slot}: ${item.name}`);
                    } else {
                        equipment[slot] = null;
                    }
                }
                this. playerEquipment[playerId] = equipment;
                print(`[EquipmentVaultSystem] ✓ 加载了已装备物品（不重复应用属性）`);
            }
        } else {
            print(`[EquipmentVaultSystem] 玩家${playerId}没有持久化数据，初始化空仓库`);
            this.playerVaults[playerId] = [];
        }
        
        print(`[EquipmentVaultSystem] ==========================================`);
    }
}