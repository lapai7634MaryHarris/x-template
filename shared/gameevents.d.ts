import { ExternalRewardItem } from "../game/scripts/src/dungeon/external_reward_pool";

declare interface CustomGameEventDeclarations {
    /**
     * 在前后端之间（UI的ts代码和游戏逻辑的ts代码之间）传递的事件，需要在此处声明事件的参数类型
     * Events and their parameters between UI TypeScript code (Panorama) and game mode TypeScript code.
     */

     /*示例测试事件
    c2s_test_event: { key: string };
    c2s_test_event_with_params: {
        foo: number;
        bar: string;
    };*/

    // 客户端显示奖励选择事件
      player_select_reward: {
        PlayerID: PlayerID;
        
        rewardIndex: number;
    };
        reward_selected: {
        PlayerID: PlayerID;
        reward:any /*{
            name: string;
            type: string;
            icon: string;
            attribute: string;
            value: number;
        }*/;
        rewardIndex: number;
    };
    // 显示奖励选择界面事件
    show_reward_selection: {
        rewards: Array<{
            name: string;
            type: string;
            icon: string;
            attribute: string;
            value: number;
        }>;
    };



    // 示例：玩家选择副本的事件
    select_dungeon: {
        PlayerID: PlayerID;
        dungeon_type: string; // 副本类型 ("A", "B", "C")
        difficulty: string;   // 难度 ("easy", "normal", "hard")
    };

    // 其他事件可以继续按照关键-参数模式进行声明...
}
declare global {
    interface CustomGameEventDeclarations {
        reward_selected: {
            PlayerID: PlayerID;         // 玩家 ID
            reward: ExternalRewardItem; // 玩家选定的奖励
        };
        show_reward_selection: {
            rewards: ExternalRewardItem[]; // 服务端发送奖励列表
        };
    }
}