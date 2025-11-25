import 'utils/index';
import { ActivateModules } from './modules';
import Precache from './utils/precache';
import { RageSystem } from "./modules/rage_system";
import './examples/abilities/warrior_sudden_death';
import './examples/modifiers/modifier_rage_attack_listener';
import './examples/modifiers/modifier_rage_ability_checker';
import './examples/abilities/warrior_thunder_strike';
import './examples/modifiers/modifier_axe_giant_strike_debuff';
import './examples/abilities/warrior_deep_wound';
import './examples/abilities/axe_giant_strike';

// ✅ 导入副本系统
import { SimpleDungeon } from "./dungeon/simple_dungeon";

// ✅ 声明全局变量
declare global {
    interface CDOTAGameRules {
        SimpleDungeon?: SimpleDungeon;
    }
}

Object.assign(getfenv(), {
    Activate: () => {
        print("=".repeat(50));
        print("[GameMode] Activating...");
        print("=".repeat(50));
        
        ActivateModules();
        RageSystem.Init();
        
        // ✅ 初始化副本系统
        GameRules.SimpleDungeon = new SimpleDungeon();
        print("[GameMode] SimpleDungeon initialized!");
        
        print("[GameMode] All modules, abilities and modifiers loaded!");
        print("=".repeat(50));
    },
    Precache: Precache,
});