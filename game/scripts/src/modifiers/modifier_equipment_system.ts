import { ExternalRewardItem, ExternalItemType, EquipmentAttribute } from "../dungeon/external_reward_pool";
// ⭐ 声明 CustomNetTable 类型
declare global {
    interface CustomNetTableDeclarations {
        equipment_system: {
            [key: string]: any;
        };
    }
}
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
    private static playerBaseArmor: { [playerId: number]: number } = {};  // ⭐ 记录基础护甲

    // 初始化玩家仓库和装备
    static InitializePlayer(playerId: PlayerID, hero?: CDOTA_BaseNPC_Hero): void {
        print(`[EquipmentVaultSystem] 初始化玩家${playerId}的仓库和装备`);
        
        // 初始化装备槽
        if (!  this.playerEquipment[playerId]) {
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
            // 优先使用传入的 hero，否则从 PlayerResource 获取
            if (!hero) {
                hero = PlayerResource.GetSelectedHeroEntity(playerId) as CDOTA_BaseNPC_Hero;
            }
            
            if (! hero) {
                print(`[EquipmentVaultSystem] ❌ 玩家${playerId}的英雄不存在`);
                return;
            }
            
            print(`[EquipmentVaultSystem] ✓ 找到玩家${playerId}的英雄：${hero.GetUnitName()}`);
            
            // ⭐ 记录英雄的原始基础护甲（只记录一次）
            if (this.playerBaseArmor[playerId] === undefined) {
                this. playerBaseArmor[playerId] = hero.GetPhysicalArmorBaseValue();
                print(`[EquipmentVaultSystem] 📝 记录基础护甲: ${this.playerBaseArmor[playerId]}`);
            }
            
            // 检查是否已经有 modifier
            const existingModifier = hero.FindModifierByName("modifier_equipment_system");
            if (existingModifier) {
                print(`[EquipmentVaultSystem] ⚠️ 已有装备系统 Modifier，跳过创建`);
                this.playerModifiers[playerId] = existingModifier;
                this.RefreshEquipmentStats(playerId);
                return;
            }
            
            print(`[EquipmentVaultSystem] 尝试添加 modifier_equipment_system... `);
            const modifier = hero.AddNewModifier(hero, undefined, "modifier_equipment_system", {});
            
            if (modifier && !modifier. IsNull()) {
                this. playerModifiers[playerId] = modifier;
                print(`[EquipmentVaultSystem] ✓ Modifier 创建成功`);
                this.RefreshEquipmentStats(playerId);
            } else {
                print(`[EquipmentVaultSystem] ❌ Modifier 创建失败`);
                print(`[EquipmentVaultSystem] 请检查 Lua 文件是否存在：`);
                print(`[EquipmentVaultSystem]   - game/scripts/vscripts/init_modifiers.lua`);
                print(`[EquipmentVaultSystem]   - game/scripts/vscripts/modifiers/modifier_equipment_system.lua`);
            }
        }
    }

    // 保存装备到仓库
    static SaveToVault(playerId: PlayerID, item: ExternalRewardItem): void {
        if (!this.playerVaults[playerId]) {
            this.playerVaults[playerId] = [];
        }
        
        this.playerVaults[playerId].push(item);
        print(`[EquipmentVaultSystem] 保存玩家${playerId}获得的装备：${item.name}`);
        
        // 保存到持久化存储
        this.SaveToPersistentStorage(playerId);
    }

    // 获取玩家仓库
    static GetVault(playerId: PlayerID): ExternalRewardItem[] {
        return this.playerVaults[playerId] || [];
    }

    // 获取玩家装备
    static GetEquipment(playerId: PlayerID): { [slot: string]: ExternalRewardItem | null } {
        return this.playerEquipment[playerId] || {};
    }

    // 装备物品
    static EquipItem(playerId: PlayerID, vaultIndex: number): boolean {
        const vault = this. GetVault(playerId);
        const item = vault[vaultIndex];
        
        if (!item) {
            print(`[EquipmentVaultSystem] ❌ 仓库索引${vaultIndex}无效`);
            return false;
        }
        
        const slot = ITEM_TYPE_TO_SLOT[item.type];
        if (!slot) {
            print(`[EquipmentVaultSystem] ❌ 无法识别装备类型：${item.type}`);
            return false;
        }
        
        const equipment = this.GetEquipment(playerId);
        
        // 如果槽位已有装备，先卸下
        if (equipment[slot]) {
            const oldItem = equipment[slot]!;
            print(`[EquipmentVaultSystem] ${slot} 槽位已有装备：${oldItem.name}，卸下旧装备`);
            this.SaveToVault(playerId, oldItem);
        }
        
        // 从仓库移除
        vault. splice(vaultIndex, 1);
        print(`[EquipmentVaultSystem] 从仓库移除：${item.name}，剩余 ${vault.length} 件`);
        
        // 装备到槽位
        equipment[slot] = item;
        
        // 刷新装备属性
        this.RefreshEquipmentStats(playerId);
        
        // 保存到持久化存储
        this.SaveToPersistentStorage(playerId);
        
        print(`[EquipmentVaultSystem] ✓ 玩家${playerId}装备了：${item.name} 到槽位 ${slot}`);
        return true;
    }

    // 卸下装备
    static UnequipItem(playerId: PlayerID, slot: EquipmentSlot): boolean {
        const equipment = this. GetEquipment(playerId);
        const item = equipment[slot];
        
        if (!item) {
            print(`[EquipmentVaultSystem] ❌ 槽位${slot}没有装备`);
            return false;
        }
        
        // 放回仓库
        this.SaveToVault(playerId, item);
        
        // 清空槽位
        equipment[slot] = null;
        
        // 刷新装备属性
        this.RefreshEquipmentStats(playerId);
        
        // 保存到持久化存储
        this.SaveToPersistentStorage(playerId);
        
        print(`[EquipmentVaultSystem] ✓ 玩家${playerId}卸下了：${item.name}`);
        return true;
    }

    // 刷新装备属性
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
        
        // ⭐ 重置护甲为基础值 + 装备护甲
        const baseArmor = this.playerBaseArmor[playerId] || 0;
        const newArmor = baseArmor + totalStats.armor;
        hero.SetPhysicalArmorBaseValue(newArmor);
        print(`[EquipmentVaultSystem] 🛡️ 设置护甲: 基础(${baseArmor}) + 装备(${totalStats.armor}) = ${newArmor}`);
        
        modifier.Destroy();
        
        print(`[EquipmentVaultSystem] ⭐ 重新创建 Modifier 以刷新属性`);
        
        const newModifier = hero.AddNewModifier(hero, undefined, "modifier_equipment_system", {});
        
        if (newModifier && !newModifier. IsNull()) {
            this. playerModifiers[playerId] = newModifier;
            
            // 调用 Modifier 的 UpdateStats 方法
            (newModifier as any).UpdateStats(totalStats);
            
            print(`[EquipmentVaultSystem] ========== 装备属性总和 ==========`);
            print(`[EquipmentVaultSystem] 力量: +${totalStats. strength}`);
            print(`[EquipmentVaultSystem] 敏捷: +${totalStats.agility}`);
            print(`[EquipmentVaultSystem] 智力: +${totalStats.intelligence}`);
            print(`[EquipmentVaultSystem] 护甲: +${totalStats.armor}`);
            print(`[EquipmentVaultSystem] =====================================`);
        } else {
            print(`[EquipmentVaultSystem] ❌ 重新创建 Modifier 失败`);
        }
    }

    // 属性枚举转换为键名
    private static AttributeToKey(attribute: EquipmentAttribute): string | null {
        const mapping: { [key: string]: string } = {
            [EquipmentAttribute.STRENGTH]: 'strength',
            [EquipmentAttribute.AGILITY]: 'agility',
            [EquipmentAttribute.INTELLIGENCE]: 'intelligence',
            [EquipmentAttribute.ARMOR]: 'armor',
            [EquipmentAttribute.HEALTH]: 'health',
            [EquipmentAttribute.MANA]: 'mana',
            [EquipmentAttribute. ATTACK_DAMAGE]: 'attack_damage',
            [EquipmentAttribute.ATTACK_SPEED]: 'attack_speed',
            [EquipmentAttribute.MOVE_SPEED]: 'move_speed',
            [EquipmentAttribute. MAGIC_RESISTANCE]: 'magic_resistance',
           
        };
        return mapping[attribute] || null;
    }

    // 持久化存储（使用 CustomNetTables）
    private static SaveToPersistentStorage(playerId: PlayerID): void {
        const vault = this.GetVault(playerId);
        const equipment = this.GetEquipment(playerId);
        
        CustomNetTables.SetTableValue("equipment_system", `player_${playerId}_vault`, { items: vault });
        CustomNetTables.SetTableValue("equipment_system", `player_${playerId}_equipment`, equipment);
    }

    private static LoadFromPersistentStorage(playerId: PlayerID): void {
        const vaultData = CustomNetTables. GetTableValue("equipment_system", `player_${playerId}_vault`);
        const equipmentData = CustomNetTables. GetTableValue("equipment_system", `player_${playerId}_equipment`);
        
        if (vaultData && vaultData.items) {
            this.playerVaults[playerId] = vaultData.items as ExternalRewardItem[];
        }
        
        if (equipmentData) {
            this.playerEquipment[playerId] = equipmentData as { [slot: string]: ExternalRewardItem | null };
        }
    }
}