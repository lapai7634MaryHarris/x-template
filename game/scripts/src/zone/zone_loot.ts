/**
 * 刷怪区域掉落系统
 */

// ==================== 材料等级定义 ====================

export enum MaterialTier {
    COMMON = "common",       // 普通材料
    FINE = "fine",           // 精良材料
    RARE = "rare",           // 稀有材料
    LEGENDARY = "legendary"  // 传说材料
}

// ==================== 掉落物品定义 ====================

export enum LootType {
    // 兑换材料
    MATERIAL_COMMON = "material_common",
    MATERIAL_FINE = "material_fine",
    MATERIAL_RARE = "material_rare",
    MATERIAL_LEGENDARY = "material_legendary",
    
    // 打造材料
    CRAFT_ADD_AFFIX = "craft_add_affix",      // 加词条
    CRAFT_REROLL_AFFIX = "craft_reroll_affix", // 洗词条
    CRAFT_REROLL_STAT = "craft_reroll_stat",   // 洗数值
    
    // 门票
    TICKET_A = "ticket_a",  // 刷怪区域难度票
    TICKET_B = "ticket_b",  // 副本入场票
    
    // 宝箱
    CHEST = "chest"
}

// 掉落物品配置
export interface LootItemConfig {
    type: LootType;
    name: string;
    icon: string;
    color: string;
    stackable: boolean;
}

export const LOOT_ITEMS: Record<LootType, LootItemConfig> = {
    // 兑换材料
    [LootType.MATERIAL_COMMON]: {
        type: LootType.MATERIAL_COMMON,
        name: "普通材料",
        icon: "item_branches",
        color: "#FFFFFF",
        stackable: true
    },
    [LootType.MATERIAL_FINE]: {
        type: LootType.MATERIAL_FINE,
        name: "精良材料",
        icon: "item_magic_stick",
        color: "#00FF00",
        stackable: true
    },
    [LootType. MATERIAL_RARE]: {
        type: LootType. MATERIAL_RARE,
        name: "稀有材料",
        icon: "item_ultimate_orb",
        color: "#0088FF",
        stackable: true
    },
    [LootType.MATERIAL_LEGENDARY]: {
        type: LootType.MATERIAL_LEGENDARY,
        name: "传说材料",
        icon: "item_reaver",
        color: "#FF8800",
        stackable: true
    },
    
    // 打造材料
    [LootType.CRAFT_ADD_AFFIX]: {
        type: LootType. CRAFT_ADD_AFFIX,
        name: "词条石",
        icon: "item_recipe",
        color: "#FF00FF",
        stackable: true
    },
    [LootType. CRAFT_REROLL_AFFIX]: {
        type: LootType. CRAFT_REROLL_AFFIX,
        name: "洗词石",
        icon: "item_recipe",
        color: "#AA00FF",
        stackable: true
    },
    [LootType. CRAFT_REROLL_STAT]: {
        type: LootType.CRAFT_REROLL_STAT,
        name: "重铸石",
        icon: "item_recipe",
        color: "#FF00AA",
        stackable: true
    },
    
    // 门票
    [LootType. TICKET_A]: {
        type: LootType. TICKET_A,
        name: "票A",
        icon: "item_tome_of_knowledge",
        color: "#FFD700",
        stackable: true
    },
    [LootType. TICKET_B]: {
        type: LootType.TICKET_B,
        name: "票B",
        icon: "item_refresher_shard",
        color: "#00FFFF",
        stackable: true
    },
    
    // 宝箱
    [LootType. CHEST]: {
        type: LootType.CHEST,
        name: "神秘宝箱",
        icon: "item_present",
        color: "#FFD700",
        stackable: false
    }
};

// ==================== 掉落表配置 ====================

export interface DropEntry {
    type: LootType;
    chance: number;      // 掉落概率 0-1
    minCount: number;
    maxCount: number;
}

// 普通怪掉落表
export const NORMAL_DROP_TABLE: DropEntry[] = [
    { type: LootType.MATERIAL_COMMON, chance: 0.6, minCount: 1, maxCount: 2 },
    { type: LootType.MATERIAL_FINE, chance: 0.05, minCount: 1, maxCount: 1 },
];

// 精英怪掉落表
export const ELITE_DROP_TABLE: DropEntry[] = [
    { type: LootType.MATERIAL_COMMON, chance: 1.0, minCount: 2, maxCount: 4 },
    { type: LootType.MATERIAL_FINE, chance: 0.5, minCount: 1, maxCount: 2 },
    { type: LootType.MATERIAL_RARE, chance: 0.1, minCount: 1, maxCount: 1 },
    { type: LootType.CRAFT_ADD_AFFIX, chance: 0.15, minCount: 1, maxCount: 1 },
    { type: LootType.CRAFT_REROLL_AFFIX, chance: 0.1, minCount: 1, maxCount: 1 },
    { type: LootType.TICKET_A, chance: 0.2, minCount: 1, maxCount: 1 },
    { type: LootType.TICKET_B, chance: 0.05, minCount: 1, maxCount: 1 },
];

// Boss掉落表
export const BOSS_DROP_TABLE: DropEntry[] = [
    { type: LootType.MATERIAL_FINE, chance: 1.0, minCount: 3, maxCount: 5 },
    { type: LootType.MATERIAL_RARE, chance: 0.6, minCount: 1, maxCount: 3 },
    { type: LootType.MATERIAL_LEGENDARY, chance: 0.1, minCount: 1, maxCount: 1 },
    { type: LootType.CRAFT_ADD_AFFIX, chance: 0.4, minCount: 1, maxCount: 2 },
    { type: LootType.CRAFT_REROLL_AFFIX, chance: 0.3, minCount: 1, maxCount: 1 },
    { type: LootType.CRAFT_REROLL_STAT, chance: 0.2, minCount: 1, maxCount: 1 },
    { type: LootType.TICKET_A, chance: 0.5, minCount: 1, maxCount: 2 },
    { type: LootType.TICKET_B, chance: 0.2, minCount: 1, maxCount: 1 },
    { type: LootType.CHEST, chance: 0.3, minCount: 1, maxCount: 1 },
];

// ==================== 玩家背包系统 ====================

// 玩家背包数据
interface PlayerInventory {
    items: Map<LootType, number>;
}

// 全局背包存储
const playerInventories: Map<PlayerID, PlayerInventory> = new Map();

// 获取或创建玩家背包
function GetOrCreateInventory(playerId: PlayerID): PlayerInventory {
    let inventory = playerInventories.get(playerId);
    if (! inventory) {
        inventory = { items: new Map() };
        playerInventories. set(playerId, inventory);
    }
    return inventory;
}

// ==================== 掉落系统主类 ====================

export class ZoneLootSystem {
    
    /**
     * 处理怪物死亡掉落
     * @param monsterType 怪物类型
     * @param playerIds 所有参与玩家ID
     * @param dropBonus 掉落加成（词条系统提供）
     */
    public static ProcessLoot(
        monsterType: "normal" | "elite" | "boss",
        playerIds: PlayerID[],
        dropBonus: number = 1.0
    ): void {
        // 选择掉落表
        let dropTable: DropEntry[];
        switch (monsterType) {
            case "elite":
                dropTable = ELITE_DROP_TABLE;
                break;
            case "boss":
                dropTable = BOSS_DROP_TABLE;
                break;
            default:
                dropTable = NORMAL_DROP_TABLE;
        }
        
        // 为每个玩家独立计算掉落
        for (const playerId of playerIds) {
            const drops = this.RollDrops(dropTable, dropBonus);
            
            if (drops.length > 0) {
                this.GiveDropsToPlayer(playerId, drops);
                this.NotifyPlayer(playerId, drops, monsterType);
            }
        }
    }
    
    /**
     * 计算掉落
     */
    private static RollDrops(dropTable: DropEntry[], dropBonus: number): { type: LootType; count: number }[] {
        const drops: { type: LootType; count: number }[] = [];
        
        for (const entry of dropTable) {
            // 应用掉落加成
            const adjustedChance = Math.min(entry.chance * dropBonus, 1.0);
            
            if (RandomFloat(0, 1) <= adjustedChance) {
                const count = RandomInt(entry.minCount, entry.maxCount);
                drops.push({ type: entry. type, count });
            }
        }
        
        return drops;
    }
    
    /**
     * 给玩家发放掉落物品
     */
    private static GiveDropsToPlayer(playerId: PlayerID, drops: { type: LootType; count: number }[]): void {
        const inventory = GetOrCreateInventory(playerId);
        
        for (const drop of drops) {
            const currentCount = inventory.items.get(drop. type) || 0;
            inventory. items.set(drop.type, currentCount + drop.count);
            
            print(`[ZoneLoot] 玩家${playerId} 获得 ${LOOT_ITEMS[drop.type]. name} x${drop.count}`);
        }
    }
    
    /**
     * 通知玩家获得的掉落
     */
    private static NotifyPlayer(
        playerId: PlayerID, 
        drops: { type: LootType; count: number }[],
        monsterType: string
    ): void {
        // 构建掉落消息
        const dropTexts = drops.map(drop => {
            const config = LOOT_ITEMS[drop. type];
            return `<font color='${config.color}'>${config.name} x${drop.count}</font>`;
        });
        
        const message = `💰 ${dropTexts.join(", ")}`;
        
        GameRules.SendCustomMessage(message, playerId, 0);
    }
    
    /**
     * 获取玩家背包内容
     */
    public static GetInventory(playerId: PlayerID): Map<LootType, number> {
        const inventory = GetOrCreateInventory(playerId);
        return new Map(inventory.items);
    }
    
    /**
     * 获取玩家某物品数量
     */
    public static GetItemCount(playerId: PlayerID, itemType: LootType): number {
        const inventory = GetOrCreateInventory(playerId);
        return inventory.items.get(itemType) || 0;
    }
    
    /**
     * 消耗玩家物品
     */
    public static ConsumeItem(playerId: PlayerID, itemType: LootType, count: number): boolean {
        const inventory = GetOrCreateInventory(playerId);
        const currentCount = inventory. items.get(itemType) || 0;
        
        if (currentCount < count) {
            return false;
        }
        
        inventory.items.set(itemType, currentCount - count);
        return true;
    }
    
    /**
     * 添加物品到玩家背包
     */
    public static AddItem(playerId: PlayerID, itemType: LootType, count: number): void {
        const inventory = GetOrCreateInventory(playerId);
        const currentCount = inventory. items.get(itemType) || 0;
        inventory.items.set(itemType, currentCount + count);
    }
}