import { ExternalRewardItem } from "../dungeon/external_reward_pool";

export class EquipmentVaultSystem {
    private static playerVaults: { [playerId: number]: ExternalRewardItem[] } = {};

    // 初始化玩家仓库
    static InitializePlayer(playerId: PlayerID): void {
        print(`[EquipmentVaultSystem] 初始化玩家${playerId}的仓库`);
        
        // 从持久化存储加载
        this.LoadFromPersistentStorage(playerId);
    }

    // 保存装备到仓库
    static SaveToVault(playerId: PlayerID, item: ExternalRewardItem): void {
        print(`[EquipmentVaultSystem] 保存玩家${playerId}获得的装备：${item.name}`);
        
        if (!this.playerVaults[playerId]) {
            this.playerVaults[playerId] = [];
        }
        
        this.playerVaults[playerId]. push(item);
        
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

    // 装备物品
    static EquipItem(playerId: PlayerID, index: number): boolean {
        const vault = this.GetVault(playerId);
        
        if (index < 0 || index >= vault. length) {
            print(`[EquipmentVaultSystem] ❌ 无效的索引：${index}`);
            return false;
        }
        
        const item = vault[index];
        
        // 应用装备属性
        this.ApplyEquipment(playerId, item);
        
        // 从仓库移除
        vault.splice(index, 1);
        
        // 持久化保存
        this.SaveToPersistentStorage(playerId);
        
        print(`[EquipmentVaultSystem] ✓ 玩家${playerId}装备了：${item.name}`);
        
        return true;
    }

    // 应用装备属性到英雄
    private static ApplyEquipment(playerId: PlayerID, item: ExternalRewardItem): void {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) {
            print(`[EquipmentVaultSystem] ❌ 找不到英雄`);
            return;
        }
        
        print(`[EquipmentVaultSystem] 应用属性：${item. name} - ${item.attribute} +${item.value}`);
        
        // 根据属性类型增加对应的属性
        switch (item. attribute) {
            case "力量":
            case "Strength":
                hero.SetBaseStrength(hero.GetBaseStrength() + item.value);
                break;
            case "敏捷":
            case "Agility":
                hero. SetBaseAgility(hero.GetBaseAgility() + item.value);
                break;
            case "智力":
            case "Intelligence":
                hero.SetBaseIntellect(hero.GetBaseIntellect() + item.value);
                break;
            case "护甲":
            case "Armor":
                hero. SetPhysicalArmorBaseValue(hero.GetPhysicalArmorBaseValue() + item.value);
                break;
            case "生命":
            case "Health":
                hero.SetMaxHealth(hero.GetMaxHealth() + item.value);
                hero.SetHealth(hero.GetHealth() + item.value);
                break;
            case "魔法":
            case "Mana":
                hero.SetMaxMana(hero.GetMaxMana() + item.value);
                hero.SetMana(hero.GetMana() + item. value);
                break;
            default:
                print(`[EquipmentVaultSystem] ⚠️ 未知的属性类型：${item.attribute}`);
        }
    }

    // ⭐ 持久化保存
private static SaveToPersistentStorage(playerId: PlayerID): void {
    const items = this.playerVaults[playerId] || [];
    
    print(`[EquipmentVaultSystem] ========== 开始持久化保存 ==========`);
    print(`[EquipmentVaultSystem] 玩家ID: ${playerId}`);
    print(`[EquipmentVaultSystem] 装备数量: ${items.length}`);
    
    // 将装备数组转换为可序列化的格式
    const serializedItems: any = {};
    items.forEach((item, index) => {
        const serialized = {
            name: item. name,
            type: item. type,
            icon: item. icon,
            attribute: item. attribute,
            value: item. value
        };
        serializedItems[index. toString()] = serialized;
        print(`[EquipmentVaultSystem]   [${index}] ${item.name} ->`, serialized);
    });
    
    const dataToSave = {
        items: serializedItems,
        timestamp: Time()
    };
    
    print(`[EquipmentVaultSystem] 准备保存的完整数据:`, dataToSave);
    print(`[EquipmentVaultSystem] CustomNetTables 是否存在: ${CustomNetTables != null}`);
    
    // 使用 CustomNetTables 保存
    CustomNetTables.SetTableValue("player_vaults", playerId.toString(), dataToSave as any);
    print(`[EquipmentVaultSystem] ✓ SetTableValue 调用完成`);
    
    // ⭐ 立即验证是否保存成功
    const verifyData = CustomNetTables.GetTableValue("player_vaults", playerId.toString());
    print(`[EquipmentVaultSystem] 验证读取的数据:`, verifyData);
    
    if (verifyData) {
        print(`[EquipmentVaultSystem] ✅ 验证成功！数据已保存`);
    } else {
        print(`[EquipmentVaultSystem] ❌ 验证失败！数据未保存`);
    }
    
    print(`[EquipmentVaultSystem] ✓ 持久化保存玩家${playerId}的仓库，共${items.length}件装备`);
    print(`[EquipmentVaultSystem] ========================================`);
}

private static LoadFromPersistentStorage(playerId: PlayerID): void {
    print(`[EquipmentVaultSystem] ========== 开始加载持久化数据 ==========`);
    print(`[EquipmentVaultSystem] 玩家ID: ${playerId}`);
    print(`[EquipmentVaultSystem] CustomNetTables 是否存在: ${CustomNetTables != null}`);
    
    const data = CustomNetTables.GetTableValue("player_vaults", playerId.toString()) as any;
    
    print(`[EquipmentVaultSystem] GetTableValue 返回:`, data);
    print(`[EquipmentVaultSystem] 数据类型: ${typeof data}`);
    print(`[EquipmentVaultSystem] 数据是否为 null: ${data === null}`);
    print(`[EquipmentVaultSystem] 数据是否为 undefined: ${data === undefined}`);
    
    if (data) {
        print(`[EquipmentVaultSystem] ✅ 读取到数据！`);
        print(`[EquipmentVaultSystem] data. items 存在: ${data.items != null}`);
        print(`[EquipmentVaultSystem] data.timestamp: ${data.timestamp}`);
    } else {
        print(`[EquipmentVaultSystem] ❌ 未读取到数据`);
    }
    
    if (data && data.items) {
        print(`[EquipmentVaultSystem] 从持久化存储加载玩家${playerId}的仓库`);
        print(`[EquipmentVaultSystem] items 类型: ${typeof data.items}`);
        
        const items: ExternalRewardItem[] = [];
        
        // 从对象格式转换回数组
        if (typeof data.items === 'object') {
            let count = 0;
            for (const key in data.items) {
                const item = data.items[key];
                print(`[EquipmentVaultSystem]   [${key}] 加载: ${item.name} (${item.attribute} +${item.value})`);
                items.push({
                    name: item.name,
                    type: item. type,
                    icon: item.icon,
                    attribute: item.attribute,
                    value: item.value
                });
                count++;
            }
            print(`[EquipmentVaultSystem] 共转换 ${count} 件装备`);
        }
        
        this.playerVaults[playerId] = items;
        print(`[EquipmentVaultSystem] ✓ 加载了${items.length}件装备`);
    } else {
        print(`[EquipmentVaultSystem] 玩家${playerId}没有持久化数据，初始化空仓库`);
        this.playerVaults[playerId] = [];
    }
    
    print(`[EquipmentVaultSystem] ==========================================`);
}
}