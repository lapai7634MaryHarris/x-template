/**
 * 副本地图配置 - 区域分离设计
 */

// ==================== 主城区 ====================
export const SPAWN_POINT = Vector(-13856, 13856, 128);

// ==================== 房间1 - 小怪房（绿色区域）====================
export const ROOM1_ENTRANCE = Vector(0, 3000, 256);      // ✅ Z=256 比主城高一层
export const ROOM1_MONSTERS = [
    Vector(-200, 3200, 256),
    Vector(0, 3200, 256),
    Vector(200, 3200, 256)
];

// ==================== 房间2 - 精英房（橙色区域）====================
export const ROOM2_ENTRANCE = Vector(0, 6000, 384);      // ✅ Z=384 更高一层
export const ROOM2_MONSTERS = [
    Vector(-300, 6200, 384),
    Vector(-150, 6200, 384),
    Vector(0, 6200, 384),
    Vector(150, 6200, 384),
    Vector(300, 6200, 384)
];

// ==================== 房间3 - Boss房（红色区域）====================
export const ROOM3_ENTRANCE = Vector(0, 9000, 512);      // ✅ Z=512 最高层
export const ROOM3_BOSS = [
    Vector(0, 9500, 512)
];