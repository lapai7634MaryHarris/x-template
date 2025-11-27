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
import { ExternalRewardItem } from "../src/dungeon/external_reward_pool";
import { SimpleDungeon } from "./dungeon/simple_dungeon";
import { EquipmentVaultSystem } from './systems/equipment_vault_system';

declare global {
    interface CDOTAGameRules {
        SimpleDungeon?: SimpleDungeon;
    }
}

let dungeonPortalInstance: CDOTA_BaseNPC | undefined = undefined;
const lastMenuTriggerTime: { [key: number]: number } = {};

function SpawnDungeonPortal(): CDOTA_BaseNPC | undefined {
    const portalLocation = Vector(-13856, 13856, 192);

    const portal = CreateUnitByName(
        "npc_dota_portal_to_dungeon",
        portalLocation,
        false,
        undefined,
        undefined,
        DotaTeam.GOODGUYS
    );
    
    if (portal) {
        print("[Dungeon Portal] 传送门已生成");
        portal.SetMoveCapability(UnitMoveCapability.NONE);
        portal.SetForwardVector(Vector(0, 1, 0));
    } else {
        print("[Dungeon Portal] 传送门创建失败");
    }
    
    return portal;
}

function MonitorPortalTrigger() {
    Timers.CreateTimer(0.25, () => {
        if (!dungeonPortalInstance || dungeonPortalInstance.IsNull()) {
            return 0.25;
        }

        const currentTime = GameRules. GetGameTime();
        const playerCount = PlayerResource.GetPlayerCount();

        for (let i = 0; i < playerCount; i++) {
            if (!PlayerResource.IsValidPlayerID(i)) continue;
            
            const hero = PlayerResource.GetSelectedHeroEntity(i);
            if (!hero || !hero.IsAlive()) continue;

            const portalPos = dungeonPortalInstance.GetAbsOrigin();
            const heroPos = hero.GetAbsOrigin();
            const dx = portalPos.x - heroPos.x;
            const dy = portalPos.y - heroPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= 200) {
                const lastTrigger = lastMenuTriggerTime[i] || 0;
                if (currentTime - lastTrigger < 3.0) {
                    continue;
                }
                
                lastMenuTriggerTime[i] = currentTime;
                
                CustomGameEventManager.Send_ServerToPlayer<{}>(
                    PlayerResource.GetPlayer(i)!,
                    "show_dungeon_menu",
                    {}
                );
            }
        }
        
        return 0.25;
    });
}

function ListenToDungeonSelection() {
    CustomGameEventManager.RegisterListener("select_dungeon", (userId, event: any) => {
        const playerId = event.PlayerID as PlayerID;
        const dungeonType = event.dungeon_type as string;
        const difficulty = event.difficulty as string;  // ⭐ 接收难度参数
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (! hero) return;
        
        // 打印调试信息
        print(`[GameMode] 玩家 ${playerId} 选择副本: ${dungeonType}, 难度: ${difficulty}`);
        
        if (dungeonType === "A") {
            if (GameRules.SimpleDungeon) {
                // ⭐ 传递难度参数给副本系统
                (GameRules. SimpleDungeon as any).StartDungeon(playerId, difficulty);
            }
            
            // 根据难度显示不同的消息
            let difficultyText = "";
            if (difficulty === "easy") {
                difficultyText = "简单";
            } else if (difficulty === "normal") {
                difficultyText = "普通";
            } else if (difficulty === "hard") {
                difficultyText = "困难";
            }
            
            GameRules. SendCustomMessage(
                `<font color='#00FF00'>正在进入副本A (${difficultyText}难度)...</font>`,
                playerId,
                0
            );
            
        } else if (dungeonType === "B") {
            GameRules.SendCustomMessage(
                `<font color='#FFAA00'>副本B开发中，敬请期待！</font>`,
                playerId,
                0
            );
        } else if (dungeonType === "C") {
            GameRules.SendCustomMessage(
                `<font color='#FFAA00'>副本C开发中，敬请期待！</font>`,
                playerId,
                0
            );
        }
    });
    // 监听奖励选择事件
    /* CustomGameEventManager.RegisterListener("reward_selected", (eventId, data) => {
        const playerId = data.PlayerID as PlayerID;
        const reward = data.reward as ExternalRewardItem;

        print(`[GameMode] 玩家 ${playerId} 选择了奖励: ${reward.name}`);

        // 保存到装备库
        EquipmentVaultSystem.SaveToVault(playerId, reward);
    });*/
    // 监听装备仓库数据请求
    CustomGameEventManager.RegisterListener("request_vault_data", (userId, event: any) => {
        const playerId = event.PlayerID as PlayerID;
        
        print(`[SimpleDungeon] 响应仓库数据请求：${playerId}`);
        
        const vault = EquipmentVaultSystem.GetVault(playerId);
        
        // 转换为可序列化格式
        const serializedItems: any = {};
        vault.forEach((item, index) => {
            serializedItems[(index + 1).toString()] = {
                name: item. name,
                type: item. type,
                icon: item. icon,
                attribute: item. attribute,
                value: item. value
            };
        });
        
        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            (CustomGameEventManager.Send_ServerToPlayer as any)(player, 'update_vault_ui', {
                items: serializedItems
            });
            print(`[SimpleDungeon] 响应仓库数据请求：${vault.length} 件装备`);
        }
    });

    // 监听从仓库装备物品
    CustomGameEventManager.RegisterListener("equip_item_from_vault", (userId, event: any) => {
        const playerId = event.PlayerID as PlayerID;
        const index = event.index as number;
        
        print(`[SimpleDungeon] 玩家${playerId}装备仓库索引${index}的装备`);
        
        if (EquipmentVaultSystem.EquipItem(playerId, index)) {
            print(`[SimpleDungeon] ✓ 装备成功`);
        } else {
            print(`[SimpleDungeon] ❌ 装备失败`);
        }
    });

    // ⭐ 监听装备界面数据请求
    CustomGameEventManager. RegisterListener("request_equipment_data", (userId, event: any) => {
        const playerId = event.PlayerID as PlayerID;
        
        print(`[SimpleDungeon] 响应装备界面数据请求：${playerId}`);
        
        const equipment = EquipmentVaultSystem.GetEquipment(playerId);
        
        // 转换为可序列化格式
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
            } else {
                serializedEquipment[slot] = null;
            }
        }
        
        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            (CustomGameEventManager.Send_ServerToPlayer as any)(player, 'update_equipment_ui', {
                equipment: serializedEquipment
            });
            print(`[SimpleDungeon] 发送装备界面数据`);
        }
    });

    // ⭐ 监听卸下装备
    CustomGameEventManager.RegisterListener("unequip_item", (userId, event: any) => {
        const playerId = event.PlayerID as PlayerID;
        const slot = event.slot as string;
        
        print(`[SimpleDungeon] 玩家${playerId}卸下槽位${slot}的装备`);
        
        if (EquipmentVaultSystem. UnequipItem(playerId, slot)) {
            print(`[SimpleDungeon] ✓ 卸下成功`);
        } else {
            print(`[SimpleDungeon] ❌ 卸下失败`);
        }
    });

    print("[GameMode] 装备系统事件监听已注册");
}

Object.assign(getfenv(), {
    Activate: () => {
        print("=".repeat(50));
        print("[GameMode] Activating...");
        print("=".repeat(50));
        
        ActivateModules();
        RageSystem.Init();
        GameRules.SimpleDungeon = new SimpleDungeon();

        dungeonPortalInstance = SpawnDungeonPortal();
        if (dungeonPortalInstance) {
            MonitorPortalTrigger();
            ListenToDungeonSelection();
            print("[GameMode] 传送门系统已启动");
        } else {
            print("[GameMode] 传送门创建失败");
        }
        
        // ⭐ 监听玩家连接事件，加载装备仓库
        ListenToGameEvent("player_connect_full", (event) => {
            const playerId = event.PlayerID as PlayerID;
            print(`[GameMode] 玩家${playerId}连接，加载装备仓库...`);
            
            // 加载玩家的装备仓库
           EquipmentVaultSystem.InitializePlayer(playerId);
        }, undefined);
        
  // ⭐ 注册装备命令（用于测试）
Convars.RegisterCommand("equip", (itemIndex: string) => {
    const player = Convars.GetCommandClient();
    
    // ⭐ 修复：如果是单人模式，使用玩家 0
    let playerId: PlayerID;
    if (player) {
        playerId = player.GetPlayerID();
    } else {
        playerId = 0 as PlayerID;  // 默认使用玩家 0
        print("[GameMode] ⚠️ 单人模式，默认使用玩家 0");
    }
    
    const index = parseInt(itemIndex);
    
    if (EquipmentVaultSystem. EquipItem(playerId, index)) {
        print(`[GameMode] ✓ 玩家${playerId}装备了索引${index}的装备`);
    } else {
        print(`[GameMode] ❌ 装备失败`);
    }
}, "装备仓库中的装备 (使用索引)", 0);
        
  // ⭐ 查看仓库命令（用于测试）
Convars.RegisterCommand("vault", () => {
    const player = Convars.GetCommandClient();
    
    // ⭐ 修复：如果是单人模式，使用玩家 0
    let playerId: PlayerID;
    if (player) {
        playerId = player.GetPlayerID();
    } else {
        playerId = 0 as PlayerID;  // 默认使用玩家 0
        print("[GameMode] ⚠️ 单人模式，默认使用玩家 0");
    }
    
    const vault = EquipmentVaultSystem.GetVault(playerId);
    
    print(`[GameMode] 玩家${playerId}的仓库 (${vault.length}件装备):`);
    vault. forEach((item, index) => {
        print(`  [${index}] ${item. name} - ${item.type} (${item.attribute} +${item.value})`);
    });
}, "查看装备仓库", 0);

        print("[GameMode] All modules loaded!");
        print("=".repeat(50));
    },
    Precache: Precache,
});