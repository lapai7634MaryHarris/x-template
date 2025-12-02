declare interface XNetTableDefinitions {
    test_table: {
        test_key: {
            data_1: string;
            data_2?: number;
            data_3?: boolean[];
            data_t?: any;
        };
    };
    settings: {
        basicSettings: BasicSettings;
    };
    performance_debug: {
        [key: string]: any;
    };
    
    // ⭐⭐⭐ 装备仓库数据
    equipment_data: {
        vault: {
            items: VaultItemData[];
            maxSize: number;
        };
        equipped: {
            [slot: string]: VaultItemData | null;
        };
        stats: EquipmentTotalStats;
    };
}


declare interface BasicSettings {}

// 专门为性能调试模块增加的表
declare interface XNetTableDefinitions {
    performance_debug: {
        [key: string]: any;
    };
}

// 以下是库内部使用的，勿动
declare interface CustomGameEventDeclarations {
    x_net_table: {
        data:
            | string // 要么是以字符串形式发送的数据块
            | XNetTableObject; // 要么是一次性发送的数据
    };
}

declare interface XNetTableObject {
    table_name: string;
    key: string;
    content: any;
}

declare interface XNetTableDataJSON {
    table: string;
    key: string;
    value: any;
}

// ⭐ 装备物品数据结构
declare interface VaultItemData {
    id: string;
    name: string;
    type: string;
    icon: string;
    rarity: number;
    stats: Array<{ attribute: string; value: number }>;
    // ⭐ 修改：affixDetails 改为数组类型
    affixDetails?: AffixDetailData[];
}

// ⭐ 词缀详情
declare interface AffixDetailData {
    position: string;
    tier: number;
    name: string;
    description: string;
    color?: string;
}

// ⭐ 装备总属性
declare interface EquipmentTotalStats {
    strength: number;
    agility: number;
    intelligence: number;
    armor: number;
    health: number;
    mana: number;
    attack_damage: number;
    attack_speed: number;
    move_speed: number;
    magic_resistance: number;
    crit_chance: number;
    crit_multiplier: number;
    cooldown_reduction: number;
    fire_resistance: number;
    cold_resistance: number;
    lightning_resistance: number;
    evasion: number;
}

declare interface BasicSettings {}