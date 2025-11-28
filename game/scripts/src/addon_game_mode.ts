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
import './modifiers/modifier_equipment_system';  // ⭐ 添加这一行
import { ZoneDungeon } from "./zone/zone_dungeon";
// 初始化模块
if (IsServer()) {
    pcall(() => require('init_modifiers'));
}
declare global {
    interface CDOTAGameRules {
        SimpleDungeon?: SimpleDungeon;
        ZoneDungeon?: ZoneDungeon;  // 新增
    }
}
declare global {
    interface CDOTAGameRules {
        SimpleDungeon?: SimpleDungeon;
    }
}
declare function require(module: string): void;
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
        if (! dungeonPortalInstance || dungeonPortalInstance.IsNull()) {
            return 0.25;
        }

        const currentTime = GameRules.GetGameTime();
        const playerCount = PlayerResource.GetPlayerCount();

        for (let i = 0; i < playerCount; i++) {
            if (! PlayerResource.IsValidPlayerID(i)) continue;
            
            const hero = PlayerResource.GetSelectedHeroEntity(i);
            if (! hero || !hero.IsAlive()) continue;

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
                    PlayerResource.GetPlayer(i)! ,
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
           // 进入刷怪区域
    if (GameRules.ZoneDungeon) {
        GameRules.ZoneDungeon.EnterFromPortal(playerId, 0);
                
                0 } else { GameRules.SendCustomMessage(
            `<font color='#FF0000'>❌ 刷怪区域系统未初始化</font>`,
            playerId,
            0
            );}
        } else if (dungeonType === "C") {
            GameRules.SendCustomMessage(
                `<font color='#FFAA00'>副本C开发中，敬请期待！</font>`,
                playerId,
                0
            );
        }
    });

    // 监听装备仓库数据请求
CustomGameEventManager.  RegisterListener("request_vault_data", (userId, event: any) => {
    const playerId = event.PlayerID as PlayerID;
    
    print(`[SimpleDungeon] 响应仓库数据请求：${playerId}`);
    
    const vault = EquipmentVaultSystem.GetVault(playerId);
    
    // ⭐ 修改：直接序列化为数组，保持 stats 为数组
    const serializedItems: any[] = [];  // ✅ 改为数组
    vault.forEach((item, index) => {
        serializedItems. push({  // ✅ 使用 push
            name: item.name,
            type: item.type,
            icon: item.icon,
            stats: item.stats  // ✅ 直接使用，不用 map
        });
    });
    
    const player = PlayerResource.GetPlayer(playerId);
    if (player) {
        (CustomGameEventManager.  Send_ServerToPlayer as any)(player, 'update_vault_ui', {
            items: serializedItems  // ✅ 发送数组
        });
        print(`[SimpleDungeon] 响应仓库数据请求：${vault.length} 件装备`);
    }
});



    // 监听装备界面数据请求
    CustomGameEventManager.RegisterListener("request_equipment_data", (userId, event: any) => {
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
                    type: item. type,
                    icon: item.icon,
                    stats: item.stats.map(stat => ({
                        attribute: stat. attribute,
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
        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            // ⭐ 序列化仓库数据
            const vault = EquipmentVaultSystem. GetVault(playerId);
            const serializedVault: any[] = [];
            vault.forEach((item) => {
                serializedVault.push({
                    name: item.name,
                    type: item.type,
                    icon: item.icon,
                    stats: item. stats
                });
            });
            
            // ⭐ 序列化装备数据
            const equipment = EquipmentVaultSystem.GetEquipment(playerId);
            const serializedEquipment: any = {};
            for (const slot in equipment) {
                const item = equipment[slot];
                if (item) {
                    serializedEquipment[slot] = {
                        name: item. name,
                        type: item.type,
                        icon: item.icon,
                        stats: item.stats
                    };
                } else {
                    serializedEquipment[slot] = null;
                }
            }
            
            // ⭐ 同时发送仓库和装备数据
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

// ⭐ 添加测试装备到仓库
function AddTestEquipmentToVault(playerId: PlayerID) {
    print(`[GameMode] 为玩家${playerId}添加测试装备... `);
    
    const testEquipments: ExternalRewardItem[] = [
        // 头盔系列
        {
            name: "新手头盔",
            type: ExternalItemType.HELMET,
            icon: "file://{images}/items/helm_of_iron_will.png",
            stats: [
                { attribute: EquipmentAttribute.STRENGTH, value: 3 },
                { attribute: EquipmentAttribute.ARMOR, value: 2 }
            ]
        },
        {
            name: "战士头盔",
            type: ExternalItemType.HELMET,
            icon: "file://{images}/items/helm_of_the_dominator.png",
            stats: [
                { attribute: EquipmentAttribute.STRENGTH, value: 10 },
                { attribute: EquipmentAttribute.ARMOR, value: 5 },
                { attribute: EquipmentAttribute.HEALTH, value: 150 }
            ]
        },
        {
            name: "传说头盔",
            type: ExternalItemType.HELMET,
            icon: "file://{images}/items/assault. png",
            stats: [
                { attribute: EquipmentAttribute.STRENGTH, value: 15 },
                { attribute: EquipmentAttribute.ARMOR, value: 10 },
                { attribute: EquipmentAttribute.HEALTH, value: 300 }
            ]
        },
        
        // 武器系列
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
            type: ExternalItemType. WEAPON,
            icon: "file://{images}/items/greater_crit.png",
            stats: [
                { attribute: EquipmentAttribute.AGILITY, value: 10 },
                { attribute: EquipmentAttribute.ATTACK_DAMAGE, value: 25 },
                { attribute: EquipmentAttribute.ATTACK_SPEED, value: 15 }
            ]
        },
        {
            name: "神圣利刃",
            type: ExternalItemType.WEAPON,
            icon: "file://{images}/items/rapier.png",
            stats: [
                { attribute: EquipmentAttribute.AGILITY, value: 18 },
                { attribute: EquipmentAttribute.ATTACK_DAMAGE, value: 50 },
                { attribute: EquipmentAttribute.ATTACK_SPEED, value: 30 }
            ]
        },
        
        // 护甲系列
        {
            name: "布甲",
            type: ExternalItemType.ARMOR,
            icon: "file://{images}/items/ring_of_protection.png",
            stats: [
                { attribute: EquipmentAttribute. ARMOR, value: 3 },
                { attribute: EquipmentAttribute.HEALTH, value: 100 },
                { attribute: EquipmentAttribute.AGILITY, value: 2 }
            ]
        },
        {
            name: "锁子甲",
            type: ExternalItemType.ARMOR,
            icon: "file://{images}/items/chainmail.png",
            stats: [
                { attribute: EquipmentAttribute.ARMOR, value: 8 },
                { attribute: EquipmentAttribute.HEALTH, value: 250 },
                { attribute: EquipmentAttribute.AGILITY, value: 5 }
            ]
        },
        {
            name: "板甲",
            type: ExternalItemType.ARMOR,
            icon: "file://{images}/items/platemail.png",
            stats: [
                { attribute: EquipmentAttribute.ARMOR, value: 12 },
                { attribute: EquipmentAttribute.HEALTH, value: 500 },
                { attribute: EquipmentAttribute.MAGIC_RESISTANCE, value: 10 }
            ]
        },
        
        // 项链系列
        {
            name: "法力项链",
            type: ExternalItemType.NECKLACE,
            icon: "file://{images}/items/aether_lens.png",
            stats: [
                { attribute: EquipmentAttribute.INTELLIGENCE, value: 8 },
                { attribute: EquipmentAttribute.MANA, value: 200 }
            ]
        },
        {
            name: "贤者项链",
            type: ExternalItemType.NECKLACE,
            icon: "file://{images}/items/mystic_staff.png",
            stats: [
                { attribute: EquipmentAttribute.INTELLIGENCE, value: 12 },
                { attribute: EquipmentAttribute.MANA, value: 350 }
            ]
        },
        
        // 戒指系列
        {
            name: "力量戒指",
            type: ExternalItemType.RING,
            icon: "file://{images}/items/ring_of_regen.png",
            stats: [
                { attribute: EquipmentAttribute.STRENGTH, value: 6 },
                { attribute: EquipmentAttribute.HEALTH, value: 150 }
            ]
        },
        {
            name: "敏捷戒指",
            type: ExternalItemType. RING,
            icon: "file://{images}/items/ring_of_aquila.png",
            stats: [
                { attribute: EquipmentAttribute. AGILITY, value: 6 },
                { attribute: EquipmentAttribute.ARMOR, value: 3 }
            ]
        },
        
        // 腰带系列
        {
            name: "皮革腰带",
            type: ExternalItemType.BELT,
            icon: "file://{images}/items/belt_of_strength.png",
            stats: [
                { attribute: EquipmentAttribute.STRENGTH, value: 7 },
                { attribute: EquipmentAttribute.HEALTH, value: 175 }
            ]
        },
        {
            name: "力量腰带",
            type: ExternalItemType.BELT,
            icon: "file://{images}/items/reaver.png",
            stats: [
                { attribute: EquipmentAttribute.STRENGTH, value: 12 },
                { attribute: EquipmentAttribute. HEALTH, value: 300 }
            ]
        },
        
        // 鞋子系列
        {
            name: "草鞋",
            type: ExternalItemType.BOOTS,
            icon: "file://{images}/items/boots.png",
            stats: [
                { attribute: EquipmentAttribute.AGILITY, value: 4 },
                { attribute: EquipmentAttribute.MOVE_SPEED, value: 25 }
            ]
        },
        {
            name: "飞行鞋",
            type: ExternalItemType. BOOTS,
            icon: "file://{images}/items/travel_boots.png",
            stats: [
                { attribute: EquipmentAttribute.AGILITY, value: 10 },
                { attribute: EquipmentAttribute.MOVE_SPEED, value: 60 }
            ]
        },
        
        // 饰品系列
        {
            name: "魔法宝石",
            type: ExternalItemType.TRINKET,
            icon: "file://{images}/items/ultimate_scepter.png",
            stats: [
                { attribute: EquipmentAttribute.INTELLIGENCE, value: 10 },
                { attribute: EquipmentAttribute. MANA, value: 250 }
            ]
        },
        {
            name: "神秘宝石",
            type: ExternalItemType.TRINKET,
            icon: "file://{images}/items/octarine_core.png",
            stats: [
                { attribute: EquipmentAttribute.INTELLIGENCE, value: 15 },
                { attribute: EquipmentAttribute.MANA, value: 400 }
            ]
        }
    ];
    
    testEquipments.forEach(item => {
        EquipmentVaultSystem.SaveToVault(playerId, item);
    });
    
    print(`[GameMode] ✓ 已添加 ${testEquipments.length} 件多属性测试装备到仓库`);
}

Object.assign(getfenv(), {
    Activate: () => {
        
        
        print("=". repeat(50));
        print("[GameMode] Activating.. .");
        print("=".repeat(50));
        
        ActivateModules();
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
        
        // ⭐ 监听玩家连接事件，加载装备仓库
   // ⭐ 监听玩家连接事件
ListenToGameEvent("player_connect_full", (event) => {
    const playerId = event.PlayerID as PlayerID;
    print(`[GameMode] 玩家${playerId}连接`);
}, undefined);


// ⭐ 监听英雄生成事件，初始化装备系统
ListenToGameEvent("npc_spawned", (event) => {
    const spawnedUnit = EntIndexToHScript(event.entindex) as CDOTA_BaseNPC;
    
    // 只处理真实英雄
    if (! spawnedUnit || !spawnedUnit.IsRealHero()) {
        return;
    }
    
    const playerId = spawnedUnit.GetPlayerOwnerID();
    if (playerId === -1) return;
    
    // 避免重复初始化（检查是否已经初始化过）
    const equipment = (EquipmentVaultSystem as any).playerEquipment[playerId];
    if (equipment) {
        return; // 已经初始化过了
    }
    
    print(`[GameMode] 玩家${playerId}的英雄已生成，初始化装备系统...`);
    
    // ⭐ 将生成的英雄传递给装备系统
    EquipmentVaultSystem.InitializePlayer(playerId, spawnedUnit as CDOTA_BaseNPC_Hero);
    
    // ⭐ 如果仓库为空，添加测试装备
    const vault = EquipmentVaultSystem.GetVault(playerId);
    if (vault.length === 0) {
        print(`[GameMode] 仓库为空，添加测试装备...`);
        AddTestEquipmentToVault(playerId);
    } else {
        print(`[GameMode] 仓库已有 ${vault.length} 件装备`);
    }
}, undefined);
        
        // ⭐ 注册装备命令（用于测试）
        Convars.RegisterCommand("equip", (itemIndex: string) => {
            const player = Convars.GetCommandClient();
            
            let playerId: PlayerID;
            if (player) {
                playerId = player.GetPlayerID();
            } else {
                playerId = 0 as PlayerID;
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
            
            let playerId: PlayerID;
            if (player) {
                playerId = player.GetPlayerID();
            } else {
                playerId = 0 as PlayerID;
                print("[GameMode] ⚠️ 单人模式，默认使用玩家 0");
            }
            
            const vault = EquipmentVaultSystem. GetVault(playerId);
            
            print(`[GameMode] 玩家${playerId}的仓库 (${vault.length}件装备):`);
            vault.forEach((item, index) => {
                const statsStr = item.stats.map(s => `${s.attribute} +${s.value}`).join(", ");
                print(`  [${index}] ${item.name} - ${item.type} (${statsStr})`);
            });
        }, "查看装备仓库", 0);

        // ⭐ 添加测试装备指令
        Convars.RegisterCommand("add_test_items", () => {
            const player = Convars.GetCommandClient();
            
            let playerId: PlayerID;
            if (player) {
                playerId = player.GetPlayerID();
            } else {
                playerId = 0 as PlayerID;
                print("[GameMode] ⚠️ 单人模式，默认使用玩家 0");
            }
            
            AddTestEquipmentToVault(playerId);
            print(`[GameMode] ✓ 已为玩家${playerId}添加测试装备`);
        }, "添加测试装备到仓库", 0);

        // ⭐ 清空仓库指令
        Convars.RegisterCommand("clear_vault", () => {
            const player = Convars.GetCommandClient();
            
            let playerId: PlayerID;
            if (player) {
                playerId = player.GetPlayerID();
            } else {
                playerId = 0 as PlayerID;
            }
            
            // 清空仓库（通过私有属性访问）
            (EquipmentVaultSystem as any).playerVaults[playerId] = [];
            (EquipmentVaultSystem as any).SaveToPersistentStorage(playerId);
            
            print(`[GameMode] ✓ 已清空玩家${playerId}的仓库`);
        }, "清空装备仓库", 0);

        print("[GameMode] All modules loaded!");
        print("=".repeat(50));
    },
    Precache: Precache,
});