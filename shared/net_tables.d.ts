declare interface CustomNetTableDeclarations {

     game_timer: {
        game_timer: {
            current_time: number;
            current_state: 1 | 2 | 3 | 4 | 5;
            current_round: number;
        };
    };
    hero_list: {
        hero_list: Record<string, string> | string[];
    };
    custom_net_table_1: {
        key_1: number;
        key_2: string;
    };
    custom_net_table_3: {
        key_1: number;
        key_2: string;
    };
    // ⭐ 新增：玩家装备仓库网络表
    player_vaults: {
        [playerId: string]: {
            items: Array<{
                name: string;
                type: string;
                icon: string;
                attribute: string;
                value: number;
            }>;
            timestamp: number;
        };
    };
}
