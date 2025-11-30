/**
 * 玩家属性收集器
 * 从护石、装备、天赋等来源汇总玩家所有词条
 */

import { StatType } from '../config/damage_config';
import { PlayerStats, createEmptyStats, addStatToPlayer } from './damage_calculator';
import { RuneSystem } from './rune_system';
// import { EquipmentSystem } from './equipment_system';  // 后续接入
// import { TalentSystem } from './talent_system';        // 后续接入

// 玩家属性缓存
const playerStatsCache: Map<PlayerID, PlayerStats> = new Map();

export class PlayerStatsCollector {
    
    /**
     * 收集玩家所有属性
     */
    public static CollectStats(playerId: PlayerID): PlayerStats {
        const stats = createEmptyStats();
        
        // 1. 从护石收集
        this.CollectFromRunes(playerId, stats);
        
        // 2. 从装备收集（后续接入）
        // this.CollectFromEquipment(playerId, stats);
        
        // 3. 从天赋收集（后续接入）
        // this. CollectFromTalents(playerId, stats);
        
        // 4. 从Buff收集（后续接入）
        // this.CollectFromBuffs(playerId, stats);
        
        // 缓存结果
        playerStatsCache. set(playerId, stats);
        
        return stats;
    }
    
    /**
     * 获取缓存的属性（性能优化用）
     */
    public static GetCachedStats(playerId: PlayerID): PlayerStats {
        return playerStatsCache. get(playerId) || this.CollectStats(playerId);
    }
    
    /**
     * 清除缓存（当属性变化时调用）
     */
    public static InvalidateCache(playerId: PlayerID): void {
        playerStatsCache.delete(playerId);
    }
    
    /**
     * 从护石收集属性
     */
    private static CollectFromRunes(playerId: PlayerID, stats: PlayerStats): void {
        // 获取玩家所有已装备的护石
        const runeData = RuneSystem.getPlayerRuneData(playerId);
        if (!runeData) return;
        
        for (const rune of runeData.inventory) {
            // 只计算已装备的护石
            if (! rune.equippedTo) continue;
            
            // 根据护石效果类型映射到StatType
            const statType = this.MapRuneEffectToStatType(rune.typeId);
            if (statType) {
                addStatToPlayer(stats, statType, rune.rollValue);
            }
        }
    }
    
    /**
     * 护石效果类型映射到StatType
     */
    private static MapRuneEffectToStatType(runeTypeId: string): StatType | null {
        const mapping: Record<string, StatType> = {
            'rune_damage': StatType.INCREASED_DAMAGE,
            'rune_range': StatType.AREA_OF_EFFECT,
            'rune_cooldown': StatType.COOLDOWN_REDUCTION,
            'rune_lifesteal': StatType.LIFESTEAL,
            'rune_crit_chance': StatType. CRIT_CHANCE,
            'rune_crit_damage': StatType.CRIT_MULTIPLIER,
            'rune_thunder_special': StatType.INCREASED_LIGHTNING_DAMAGE,
            'rune_execute_special': StatType.MELEE_DAMAGE,
            // 后续添加更多映射
        };
        
        return mapping[runeTypeId] || null;
    }
    
    // /**
    //  * 从装备收集属性（后续实现）
    //  */
    // private static CollectFromEquipment(playerId: PlayerID, stats: PlayerStats): void {
    //     const equipment = EquipmentSystem. GetEquipment(playerId);
    //     for (const slot in equipment) {
    //         const item = equipment[slot];
    //         if (! item) continue;
    //         for (const affix of item.affixes) {
    //             addStatToPlayer(stats, affix.type, affix.value);
    //         }
    //     }
    // }
}