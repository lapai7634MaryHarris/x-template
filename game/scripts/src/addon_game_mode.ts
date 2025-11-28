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
import { ExternalRewardItem, ExternalItemType, EquipmentAttribute } from "./dungeon/external_reward_pool";
import { SimpleDungeon } from "./dungeon/simple_dungeon";
import { EquipmentVaultSystem } from './systems/equipment_vault_system';
import './modifiers/modifier_equipment_system';
import { ZoneDungeon } from "./zone/zone_dungeon";
import { MaterialUseSystem } from './zone/zone_loot';
import { ClassSystem } from './systems/class_system';  // ⭐ 新增导入

// 初始化模块
if (IsServer()) {
    pcall(() => require('init_modifiers'));
}

declare global {
    interface CDOTAGameRules {
        SimpleDungeon?: SimpleDungeon;
        ZoneDungeon?: ZoneDungeon;
    }
}

declare function require(module: string): void;

MaterialUseSystem.Init();

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
        DotaTeam. GOODGUYS
    );
    
    if (portal) {
        print("[Dungeon Portal] 传送门已生成");
        portal.SetMoveCapability(UnitMoveCapability. NONE);
        portal.SetForwardVector(Vector(0, 1, 0));
    } else {
        print("[Dungeon Portal] 传送门创建失败");
    }
    
    return portal;
}

function MonitorPortalTrigger() {
    Timers.CreateTimer(0.25, () => {
        if (! dungeonPortalInstance || dungeonPortalInstance.IsNull()) {
            return 0.25;
        }

        const currentTime = GameRules.GetGameTime();
        const playerCount = PlayerResource.GetPlayerCount();

        for (let i = 0; i < playerCount; i++) {
            if (! PlayerResource.IsValidPlayerID(i)) continue;
            
            // ⭐ 检查玩家是否已选择职业
            if (! ClassSystem.HasSelectedClass(i as PlayerID)) continue;
            
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
        const difficulty = event.difficulty as string;
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) return;
        
        print(`[GameMode] 玩家 ${playerId} 选择副本: ${dungeonType}, 难度: ${difficulty}`);
        
        if (dungeonType === "A") {
            if (GameRules.SimpleDungeon) {
                (GameRules.SimpleDungeon as any).StartDungeon(playerId, difficulty);
            }
            
            let difficultyText = "";
            if (difficulty === "easy") {
                difficultyText = "简单";
            } else if (difficulty === "normal") {
                difficultyText = "普通";
            } else if (difficulty === "hard") {
                difficultyText = "困难";
            }
            
            GameRules.SendCustomMessage(
                `<font color='#00FF00'>正在进入副本A (${difficultyText}难度)...</font>`,
                playerId,
                0
            );
            
        } else if (dungeonType === "B") {
            if (GameRules. ZoneDungeon) {
                GameRules.ZoneDungeon.EnterFromPortal(playerId, 0);
            } else {
                GameRules.SendCustomMessage(
                    `<font color='#FF0000'>❌ 刷怪区域系统未初始化</font>`,
                    playerId,
                    0
                );
            }
        } else if (dungeonType === "C") {
            GameRules.SendCustomMessage(
                `<font color='#FFAA00'>副本C开发中，敬请期待！</font>`,
                playerId,
                0
            );
        }
    });

    // 监听装备仓库数据请求
    CustomGameEventManager.RegisterListener("request_vault_data", (userId, event: any) => {
        const playerId = event.PlayerID as PlayerID;
        
        print(`[SimpleDungeon] 响应仓库数据请求：${playerId}`);
        
        const vault = EquipmentVaultSystem.GetVault(playerId);
        
        const serializedItems: any[] = [];
        vault.forEach((item, index) => {
            serializedItems.push({
                name: item.name,
                type: item.type,
                icon: item.icon,
                stats: item.stats
            });
        });
        
        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            (CustomGameEventManager. Send_ServerToPlayer as any)(player, 'update_vault_ui', {
                items: serializedItems
            });
            print(`[SimpleDungeon] 响应仓库数据请求：${vault.length} 件装备`);
        }
    });

    // 监听装备界面数据请求
    CustomGameEventManager. RegisterListener("request_equipment_data", (userId, event: any) => {
        const playerId = event.PlayerID as PlayerID;
        
        print(`[SimpleDungeon] 响应装备界面数据请求：${playerId}`);
        
        const equipment = EquipmentVaultSystem.GetEquipment(playerId);
        
        const serializedEquipment: any = {};
        for (const slot in equipment) {
            const item = equipment[slot];
            if (item) {
                serializedEquipment[slot] = {
                    name: item.name,
                    type: item.type,
                    icon: item.icon,
                    stats: item. stats. map(stat => ({
                        attribute: stat.attribute,
                        value: stat.value
                    }))
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

    // 监听卸下装备
    CustomGameEventManager.RegisterListener("unequip_item", (userId, event: any) => {
        const playerId = event.PlayerID as PlayerID;
        const slot = event.slot as string;
        
        print(`[SimpleDungeon] 玩家${playerId}卸下槽位${slot}的装备`);
        
        if (EquipmentVaultSystem.UnequipItem(playerId, slot)) {
            const player = PlayerResource. GetPlayer(playerId);
            if (player) {
                const vault = EquipmentVaultSystem.GetVault(playerId);
                const serializedVault: any[] = [];
                vault.forEach((item) => {
                    serializedVault. push({
                        name: item.name,
                        type: item.type,
                        icon: item.icon,
                        stats: item.stats
                    });
                });
                
                const equipment = EquipmentVaultSystem.GetEquipment(playerId);
                const serializedEquipment: any = {};
                for (const slot in equipment) {
                    const item = equipment[slot];
                    if (item) {
                        serializedEquipment[slot] = {
                            name: item.name,
                            type: item.type,
                            icon: item. icon,
                            stats: item.stats
                        };
                    } else {
                        serializedEquipment[slot] = null;
                    }
                }
                
                (CustomGameEventManager. Send_ServerToPlayer as any)(player, 'update_vault_ui', {
                    items: serializedVault
                });
                
                (CustomGameEventManager. Send_ServerToPlayer as any)(player, 'update_equipment_ui', {
                    equipment: serializedEquipment
                });
                
                print(`[SimpleDungeon] ✓ 卸下成功，已推送更新数据`);
            }
        } else {
            print(`[SimpleDungeon] ❌ 卸下失败`);
        }
    });

    print("[GameMode] 装备系统事件监听已注册");
}

// 添加测试装备到仓库
function AddTestEquipmentToVault(playerId: PlayerID) {
    print(`[GameMode] 为玩家${playerId}添加测试装备... `);
    
    const testEquipments: ExternalRewardItem[] = [
        {
            name: "新手头盔",
            type: ExternalItemType. HELMET,
            icon: "file://{images}/items/helm_of_iron_will.png",
            stats: [
                { attribute: EquipmentAttribute. STRENGTH, value: 3 },
                { attribute: EquipmentAttribute.ARMOR, value: 2 }
            ]
        },
        {
            name: "战士头盔",
            type: ExternalItemType.HELMET,
            icon: "file://{images}/items/helm_of_the_dominator.png",
            stats: [
                { attribute: EquipmentAttribute. STRENGTH, value: 10 },
                { attribute: EquipmentAttribute.ARMOR, value: 5 },
                { attribute: EquipmentAttribute.HEALTH, value: 150 }
            ]
        },
        {
            name: "生锈的剑",
            type: ExternalItemType.WEAPON,
            icon: "file://{images}/items/lesser_crit. png",
            stats: [
                { attribute: EquipmentAttribute.AGILITY, value: 5 },
                { attribute: EquipmentAttribute.ATTACK_DAMAGE, value: 12 }
            ]
        },
        {
            name: "精钢之剑",
            type: ExternalItemType.WEAPON,
            icon: "file://{images}/items/greater_crit.png",
            stats: [
                { attribute: EquipmentAttribute.AGILITY, value: 10 },
                { attribute: EquipmentAttribute.ATTACK_DAMAGE, value: 25 },
                { attribute: EquipmentAttribute.ATTACK_SPEED, value: 15 }
            ]
        },
        {
            name: "布甲",
            type: ExternalItemType. ARMOR,
            icon: "file://{images}/items/ring_of_protection.png",
            stats: [
                { attribute: EquipmentAttribute. ARMOR, value: 3 },
                { attribute: EquipmentAttribute.HEALTH, value: 100 }
            ]
        },
        {
            name: "力量戒指",
            type: ExternalItemType.RING,
            icon: "file://{images}/items/ring_of_regen.png",
            stats: [
                { attribute: EquipmentAttribute. STRENGTH, value: 6 },
                { attribute: EquipmentAttribute.HEALTH, value: 150 }
            ]
        },
        {
            name: "草鞋",
            type: ExternalItemType.BOOTS,
            icon: "file://{images}/items/boots. png",
            stats: [
                { attribute: EquipmentAttribute.AGILITY, value: 4 },
                { attribute: EquipmentAttribute.MOVE_SPEED, value: 25 }
            ]
        },
    ];
    
    testEquipments.forEach(item => {
        EquipmentVaultSystem.SaveToVault(playerId, item);
    });
    
    print(`[GameMode] ✓ 已添加 ${testEquipments.length} 件测试装备到仓库`);
}

Object.assign(getfenv(), {
    Activate: () => {
        print("=". repeat(50));
        print("[GameMode] Activating.. .");
        print("=".repeat(50));
        
        ActivateModules();
        
        // ⭐ 初始化职业系统（在其他系统之前）
        ClassSystem.Init();
        
        RageSystem.Init();
        GameRules.SimpleDungeon = new SimpleDungeon();
        GameRules.ZoneDungeon = new ZoneDungeon();
        
        dungeonPortalInstance = SpawnDungeonPortal();
        if (dungeonPortalInstance) {
            MonitorPortalTrigger();
            ListenToDungeonSelection();
            print("[GameMode] 传送门系统已启动");
        } else {
            print("[GameMode] 传送门创建失败");
        }
        
        // 监听玩家连接事件
        ListenToGameEvent("player_connect_full", (event) => {
            const playerId = event. PlayerID as PlayerID;
            print(`[GameMode] 玩家${playerId}连接`);
        }, undefined);

        // ⭐ 修改：监听英雄生成事件，但只在职业选择后处理
        ListenToGameEvent("npc_spawned", (event) => {
            const spawnedUnit = EntIndexToHScript(event.entindex) as CDOTA_BaseNPC;
            
            if (! spawnedUnit || !spawnedUnit.IsRealHero()) {
                return;
            }
            
            const playerId = spawnedUnit.GetPlayerOwnerID();
            if (playerId === -1) return;
            
            // ⭐ 检查是否已选择职业
            if (!ClassSystem.HasSelectedClass(playerId)) {
                print(`[GameMode] 玩家${playerId}尚未选择职业，跳过装备初始化`);
                return;
            }
            
            // 避免重复初始化
            const equipment = (EquipmentVaultSystem as any).playerEquipment[playerId];
            if (equipment) {
                return;
            }
            
            print(`[GameMode] 玩家${playerId}的英雄已生成，初始化装备系统... `);
            
            EquipmentVaultSystem.InitializePlayer(playerId, spawnedUnit as CDOTA_BaseNPC_Hero);
            
            const vault = EquipmentVaultSystem. GetVault(playerId);
            if (vault.length === 0) {
                print(`[GameMode] 仓库为空，添加测试装备...`);
                AddTestEquipmentToVault(playerId);
            } else {
                print(`[GameMode] 仓库已有 ${vault.length} 件装备`);
            }
        }, undefined);
        
        // 注册测试命令
        Convars.RegisterCommand("equip", (itemIndex: string) => {
            const player = Convars.GetCommandClient();
            let playerId: PlayerID = player ?  player.GetPlayerID() : 0 as PlayerID;
            const index = parseInt(itemIndex);
            
            if (EquipmentVaultSystem. EquipItem(playerId, index)) {
                print(`[GameMode] ✓ 玩家${playerId}装备了索引${index}的装备`);
            } else {
                print(`[GameMode] ❌ 装备失败`);
            }
        }, "装备仓库中的装备", 0);
        
        Convars.RegisterCommand("vault", () => {
            const player = Convars.GetCommandClient();
            let playerId: PlayerID = player ? player. GetPlayerID() : 0 as PlayerID;
            const vault = EquipmentVaultSystem. GetVault(playerId);
            
            print(`[GameMode] 玩家${playerId}的仓库 (${vault.length}件装备):`);
            vault.forEach((item, index) => {
                const statsStr = item.stats.map(s => `${s. attribute} +${s.value}`).join(", ");
                print(`  [${index}] ${item.name} - ${item.type} (${statsStr})`);
            });
        }, "查看装备仓库", 0);

        Convars.RegisterCommand("add_test_items", () => {
            const player = Convars.GetCommandClient();
            let playerId: PlayerID = player ? player. GetPlayerID() : 0 as PlayerID;
            AddTestEquipmentToVault(playerId);
            print(`[GameMode] ✓ 已为玩家${playerId}添加测试装备`);
        }, "添加测试装备到仓库", 0);

        Convars.RegisterCommand("clear_vault", () => {
            const player = Convars. GetCommandClient();
            let playerId: PlayerID = player ?  player.GetPlayerID() : 0 as PlayerID;
            (EquipmentVaultSystem as any). playerVaults[playerId] = [];
            (EquipmentVaultSystem as any). SaveToPersistentStorage(playerId);
            print(`[GameMode] ✓ 已清空玩家${playerId}的仓库`);
        }, "清空装备仓库", 0);

        // ⭐ 新增：查看职业命令
        Convars.RegisterCommand("myclass", () => {
            const player = Convars.GetCommandClient();
            let playerId: PlayerID = player ? player. GetPlayerID() : 0 as PlayerID;
            const classConfig = ClassSystem.GetPlayerClassConfig(playerId);
            
            if (classConfig) {
                print(`[GameMode] 玩家${playerId}的职业: ${classConfig.name}`);
            } else {
                print(`[GameMode] 玩家${playerId}尚未选择职业`);
            }
        }, "查看当前职业", 0);

        print("[GameMode] All modules loaded!");
        print("=".repeat(50));
    },
    Precache: Precache,
});