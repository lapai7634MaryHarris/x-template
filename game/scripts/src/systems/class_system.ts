/**
 * 职业系统
 * 管理玩家职业选择和英雄分配
 */

// 职业枚举
export enum PlayerClass {
    WARRIOR = 'warrior',
    UNKNOWN = 'unknown',
}

// 职业配置
interface ClassConfig {
    id: PlayerClass;
    name: string;
    heroName: string;
    overrideHero: string;
    innatePassive: string;
    available: boolean;
}

// 职业配置表
const CLASS_CONFIGS: Record<PlayerClass, ClassConfig> = {
    [PlayerClass. WARRIOR]: {
        id: PlayerClass.WARRIOR,
        name: '战士',
        heroName: 'npc_dota_hero_axe',
        overrideHero: 'npc_hero_template_test',
        innatePassive: 'warrior_deep_wound',
        available: true,
    },
    [PlayerClass.UNKNOWN]: {
        id: PlayerClass.UNKNOWN,
        name: '???',
        heroName: '',
        overrideHero: '',
        innatePassive: '',
        available: false,
    },
};

// 玩家职业数据
interface PlayerClassData {
    classId: PlayerClass;
    confirmed: boolean;
}

export class ClassSystem {
    private static playerClasses: Map<PlayerID, PlayerClassData> = new Map();
    private static initialized: boolean = false;

    /**
     * 初始化职业系统
     */
    public static Init(): void {
        if (this.initialized) return;

        print('[ClassSystem] 初始化职业系统.. .');

        // 监听职业选择事件
        CustomGameEventManager.RegisterListener('select_class', (userId, event: any) => {
            const playerId = event.PlayerID as PlayerID;
            const classId = event.classId as string;

            print(`[ClassSystem] 收到职业选择: 玩家${playerId} 选择 ${classId}`);

            this.OnPlayerSelectClass(playerId, classId as PlayerClass);
        });

        this.initialized = true;
        print('[ClassSystem] 职业系统初始化完成');
    }

    /**
     * 处理玩家职业选择
     */
    private static OnPlayerSelectClass(playerId: PlayerID, classId: PlayerClass): void {
        // 检查职业是否可用
        const classConfig = CLASS_CONFIGS[classId];
        if (!classConfig || !classConfig.available) {
            print(`[ClassSystem] ❌ 职业 ${classId} 不可用`);
            this.SendSelectionFailed(playerId, '该职业尚未开发');
            return;
        }

        // 检查玩家是否已经确认过职业
        if (this.playerClasses.has(playerId)) {
            const existingData = this.playerClasses.get(playerId)!;
            if (existingData. confirmed) {
                print(`[ClassSystem] ❌ 玩家 ${playerId} 已经选择过职业`);
                this.SendSelectionFailed(playerId, '你已经选择过职业');
                return;
            }
        }

        // 获取玩家当前英雄（强制英雄模式下已经有了）
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (!hero) {
            print(`[ClassSystem] ⚠️ 玩家 ${playerId} 还没有英雄，等待英雄生成... `);
            
            // 延迟处理
            Timers.CreateTimer(0.5, () => {
                const delayedHero = PlayerResource.GetSelectedHeroEntity(playerId);
                if (delayedHero) {
                    this. ConfirmClassSelection(playerId, classConfig, delayedHero);
                } else {
                    this.SendSelectionFailed(playerId, '英雄尚未生成，请稍后再试');
                }
                return undefined;
            });
            return;
        }

        // 确认职业选择
        this. ConfirmClassSelection(playerId, classConfig, hero);
    }

    /**
     * 确认职业选择
     */
    private static ConfirmClassSelection(
        playerId: PlayerID,
        classConfig: ClassConfig,
        hero: CDOTA_BaseNPC_Hero
    ): void {
        print(`[ClassSystem] ✓ 玩家 ${playerId} 确认职业: ${classConfig.name}`);

        // 记录玩家职业
        this.playerClasses.set(playerId, {
            classId: classConfig.id,
            confirmed: true,
        });

        // 设置英雄（技能等已在 heroes.txt 中配置）
        this.SetupHero(hero, classConfig);

        // 传送到出生点
        const spawnPoint = Vector(-7000, -6500, 128);
        FindClearSpaceForUnit(hero, spawnPoint, true);

        // 发送确认事件到客户端
        const player = PlayerResource.GetPlayer(playerId);
        if (player) {
            CustomGameEventManager.Send_ServerToPlayer(player, 'class_selection_confirmed' as any, {
                classId: classConfig.id,
                className: classConfig.name,
                success: true,
            });
        }

        // 显示欢迎消息
        GameRules.SendCustomMessage(
            `<font color='#00FF00'>🎉 欢迎，${classConfig.name}！你的冒险开始了！</font>`,
            playerId,
            0
        );

        print(`[ClassSystem] ✓ 职业选择完成`);
    }

    /**
     * 设置英雄
     */
    private static SetupHero(hero: CDOTA_BaseNPC_Hero, classConfig: ClassConfig): void {
        // 确保先天被动技能已学习
        if (classConfig.innatePassive) {
            const innateAbility = hero.FindAbilityByName(classConfig.innatePassive);
            if (innateAbility && innateAbility. GetLevel() === 0) {
                innateAbility.SetLevel(1);
                print(`[ClassSystem] ✓ 设置先天被动: ${classConfig.innatePassive}`);
            }
        }

        // 移除默认物品
        for (let i = 0; i < 9; i++) {
            const item = hero.GetItemInSlot(i);
            if (item) {
                hero.RemoveItem(item);
            }
        }

        print(`[ClassSystem] ✓ 英雄设置完成`);
    }

    /**
     * 发送选择失败消息
     */
    private static SendSelectionFailed(playerId: PlayerID, reason: string): void {
        const player = PlayerResource. GetPlayer(playerId);
        if (! player) return;

        CustomGameEventManager.Send_ServerToPlayer(player, 'class_selection_failed' as any, {
            reason: reason,
            success: false,
        });

        GameRules.SendCustomMessage(
            `<font color='#FF0000'>❌ ${reason}</font>`,
            playerId,
            0
        );
    }

    /**
     * 获取玩家职业
     */
    public static GetPlayerClass(playerId: PlayerID): PlayerClass | null {
        const data = this.playerClasses.get(playerId);
        return data ? data.classId : null;
    }

    /**
     * 获取玩家职业配置
     */
    public static GetPlayerClassConfig(playerId: PlayerID): ClassConfig | null {
        const classId = this.GetPlayerClass(playerId);
        if (!classId) return null;
        return CLASS_CONFIGS[classId] || null;
    }

    /**
     * 检查玩家是否已选择职业
     */
    public static HasSelectedClass(playerId: PlayerID): boolean {
        const data = this.playerClasses.get(playerId);
        return data !== undefined && data.confirmed;
    }
}