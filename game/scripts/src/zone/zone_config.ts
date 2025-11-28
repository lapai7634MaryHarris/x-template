/**
 * 刷怪区域配置
 */

// ==================== 基础设定 ====================
export const ZONE_CONFIG = {
    // 时间设定
    DURATION: 600,              // 持续时间：10分钟 = 600秒
    SPAWN_INTERVAL: 30,         // 刷怪间隔：30秒
    
    // 怪物数量
    MAX_MONSTERS: 50,           // 场上怪物上限
    
    // 难度递进时间点（秒）
    DIFFICULTY_TIME_1: 180,     // 3分钟
    DIFFICULTY_TIME_2: 360,     // 6分钟
    
    // 难度递进倍率
    DIFFICULTY_MULT_1: 1.2,     // 3-6分钟：1.2x
    DIFFICULTY_MULT_2: 1.5,     // 6-10分钟：1.5x
    
    // 积分触发（测试值）
    ELITE_TRIGGER_SCORE: 10,    // 10分触发精英
    BOSS_TRIGGER_SCORE: 50,     // 50分触发Boss
    
    // 疲劳消耗
    FATIGUE_COST: 8,            // 每次进入消耗8点疲劳
};

// ==================== 怪物积分 ====================
export const MONSTER_SCORE = {
    normal: 1,
    elite: 10,
    boss: 50,
};

// ==================== 多人属性缩放 ====================
export const PARTY_SCALING: Record<number, { health: number; damage: number }> = {
    1: { health: 1.0, damage: 1.0 },
    2: { health: 1.6, damage: 1.2 },
    3: { health: 2.2, damage: 1.4 },
    4: { health: 2.8, damage: 1.6 },
};

// ==================== 群落配置 ====================
export const CLUSTER_CONFIG = {
    small: { min: 3, max: 5 },      // 小群
    medium: { min: 8, max: 12 },    // 中群
    large: { min: 15, max: 20 },    // 大群
};

// ==================== 区域坐标 ====================
// 你的Hammer区域配置
export const ZONE_AREA = {
    center: Vector(-13216, 7776, 128),  // 区域中心点
    halfSize: 3168,                      // 半边长 (6336/2)
    z: 128,
};

// 计算区域边界
export const ZONE_BOUNDS = {
    minX: ZONE_AREA.center. x - ZONE_AREA.halfSize,  // -16384
    maxX: ZONE_AREA.center.x + ZONE_AREA.halfSize,  // -10048
    minY: ZONE_AREA.center.y - ZONE_AREA.halfSize,  // 4608
    maxY: ZONE_AREA.center.y + ZONE_AREA.halfSize,  // 10944
};

// 刷怪点（9个点均匀分布在区域内）
export const SPAWN_POINTS: Vector[] = [
    // 第一排
    Vector(ZONE_BOUNDS.minX + 1000, ZONE_BOUNDS.minY + 1000, ZONE_AREA.z),
    Vector(ZONE_AREA.center.x, ZONE_BOUNDS.minY + 1000, ZONE_AREA.z),
    Vector(ZONE_BOUNDS.maxX - 1000, ZONE_BOUNDS.minY + 1000, ZONE_AREA.z),
    // 第二排
    Vector(ZONE_BOUNDS.minX + 1000, ZONE_AREA.center.y, ZONE_AREA.z),
    Vector(ZONE_AREA.center. x, ZONE_AREA.center.y, ZONE_AREA.z),
    Vector(ZONE_BOUNDS.maxX - 1000, ZONE_AREA.center.y, ZONE_AREA.z),
    // 第三排
    Vector(ZONE_BOUNDS. minX + 1000, ZONE_BOUNDS.maxY - 1000, ZONE_AREA.z),
    Vector(ZONE_AREA.center. x, ZONE_BOUNDS.maxY - 1000, ZONE_AREA.z),
    Vector(ZONE_BOUNDS.maxX - 1000, ZONE_BOUNDS.maxY - 1000, ZONE_AREA.z),
];

// 玩家入口点（区域中心）
export const ZONE_ENTRANCE = Vector(ZONE_AREA.center.x, ZONE_AREA.center.y, ZONE_AREA.z);

// 主城传送点（和你现有的一致）
export const TOWN_SPAWN = Vector(-13856, 13856, 128);