/**
 * 职业系统
 */

import { SkillPointSystem } from './skill_point_system';

export enum PlayerClass {
    WARRIOR = 'warrior',
    UNKNOWN = 'unknown',
}

interface ClassConfig {
    id: PlayerClass;
    name: string;
    heroName: string;
    innatePassive: string;
    available: boolean;
}

const CLASS_CONFIGS: Record<PlayerClass, ClassConfig> = {
    [PlayerClass.WARRIOR]: {
        id: PlayerClass.WARRIOR,
        name: '战士',
        heroName: 'npc_dota_hero_axe',
        innatePassive: 'warrior_deep_wound',
        available: true,
    },
    [PlayerClass. UNKNOWN]: {
        id: PlayerClass.UNKNOWN,
        name: '??? ',
        heroName: '',
        innatePassive: '',
        available: false,
    },
};

interface PlayerClassData {
    classId: PlayerClass;
    confirmed: boolean;
}

export class ClassSystem {
    private static playerClasses: Map<PlayerID, PlayerClassData> = new Map();
    private static initialized: boolean = false;

    public static Init(): void {
        if (this.initialized) return;

        print('========================================');
        print('[ClassSystem] 初始化职业系统');
        print('========================================');

        CustomGameEventManager.RegisterListener('select_class', (userId, event) => {
            print('[ClassSystem] 收到职业选择事件');
            
            const data = event as any;
            const playerId = data.PlayerID as PlayerID;
            const classId = data.classId as string;

            print('[ClassSystem] playerId: ' + playerId + ', classId: ' + classId);

            this.OnPlayerSelectClass(playerId, classId as PlayerClass);
        });

        this.initialized = true;
        print('[ClassSystem] 职业系统初始化完成');
    }

    private static OnPlayerSelectClass(playerId: PlayerID, classId: PlayerClass): void {
        const classConfig = CLASS_CONFIGS[classId];
        if (!classConfig || ! classConfig.available) {
            print('[ClassSystem] 职业不可用: ' + classId);
            this.SendSelectionFailed(playerId, '该职业尚未开发');
            return;
        }

        const existingData = this. playerClasses.get(playerId);
        if (existingData && existingData.confirmed) {
            print('[ClassSystem] 玩家已选择过职业');
            this.SendSelectionFailed(playerId, '你已经选择过职业');
            return;
        }

        this.WaitForHeroAndConfirm(playerId, classConfig, 0);
    }

    private static WaitForHeroAndConfirm(playerId: PlayerID, classConfig: ClassConfig, attempt: number): void {
        const maxAttempts = 10;
        
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        
        if (hero) {
            print('[ClassSystem] 找到英雄: ' + hero.GetUnitName());
            this.ConfirmClassSelection(playerId, classConfig, hero);
            return;
        }

        if (attempt >= maxAttempts) {
            print('[ClassSystem] 等待英雄超时');
            this.SendSelectionFailed(playerId, '英雄生成超时，请重试');
            return;
        }

        print('[ClassSystem] 等待英雄生成...尝试 ' + (attempt + 1) + '/' + maxAttempts);
        
        Timers.CreateTimer(0.5, () => {
            this.WaitForHeroAndConfirm(playerId, classConfig, attempt + 1);
            return undefined;
        });
    }

    private static ConfirmClassSelection(
        playerId: PlayerID,
        classConfig: ClassConfig,
        hero: CDOTA_BaseNPC_Hero
    ): void {
        print('========================================');
        print('[ClassSystem] 确认职业选择');
        print('[ClassSystem] 玩家: ' + playerId + ', 职业: ' + classConfig.name);
        print('========================================');

        this.playerClasses. set(playerId, {
            classId: classConfig.id,
            confirmed: true,
        });

        this.SetupHero(hero, classConfig);

        // ⭐ 修正：直接调用 SkillPointSystem. initPlayer()
        SkillPointSystem. initPlayer(playerId);
        print('[ClassSystem] 已初始化玩家技能点系统');

        // 修正出生点坐标
        const spawnPoint = Vector(-13760, 12544, 192);
        FindClearSpaceForUnit(hero, spawnPoint, true);

        // 发送确认事件
        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            print('[ClassSystem] 发送确认事件到客户端');
            CustomGameEventManager.Send_ServerToPlayer(
                player,
                'class_selection_confirmed' as never,
                {
                    classId: classConfig. id,
                    className: classConfig.name,
                    success: true,
                } as never
            );
        }

        GameRules.SendCustomMessage(
            '<font color="#00FF00">欢迎，' + classConfig.name + '！你的冒险开始了！</font>',
            playerId,
            0
        );

        print('[ClassSystem] 职业选择完成！');
    }

    private static SetupHero(hero: CDOTA_BaseNPC_Hero, classConfig: ClassConfig): void {
        print('[ClassSystem] 设置英雄: ' + hero.GetUnitName());
        
        if (classConfig.innatePassive) {
            const innateAbility = hero.FindAbilityByName(classConfig.innatePassive);
            if (innateAbility && innateAbility.GetLevel() === 0) {
                innateAbility.SetLevel(1);
                print('[ClassSystem] 设置先天被动: ' + classConfig.innatePassive);
            }
        }

        for (let i = 0; i < 9; i++) {
            const item = hero. GetItemInSlot(i);
            if (item) {
                hero.RemoveItem(item);
            }
        }
    }

    private static SendSelectionFailed(playerId: PlayerID, reason: string): void {
        print('[ClassSystem] 选择失败: ' + reason);
        
        const player = PlayerResource.GetPlayer(playerId);
        if (! player) return;

        CustomGameEventManager.Send_ServerToPlayer(
            player,
            'class_selection_failed' as never,
            {
                reason: reason,
                success: false,
            } as never
        );

        GameRules.SendCustomMessage(
            '<font color="#FF0000">' + reason + '</font>',
            playerId,
            0
        );
    }

    public static GetPlayerClass(playerId: PlayerID): PlayerClass | null {
        const data = this.playerClasses. get(playerId);
        return data ? data.classId : null;
    }

    public static GetPlayerClassConfig(playerId: PlayerID): ClassConfig | null {
        const classId = this. GetPlayerClass(playerId);
        if (! classId) return null;
        return CLASS_CONFIGS[classId] || null;
    }

    public static HasSelectedClass(playerId: PlayerID): boolean {
        const data = this.playerClasses.get(playerId);
        return data !== undefined && data. confirmed;
    }
}