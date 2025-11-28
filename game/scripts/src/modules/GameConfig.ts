export class GameConfig {
    constructor() {
        SendToServerConsole('dota_max_physical_items_purchase_limit 9999');

        // ⭐ 关键：所有时间设置为 0，跳过等待阶段
        GameRules. SetCustomGameSetupAutoLaunchDelay(0);
        GameRules.SetCustomGameSetupRemainingTime(0);
        GameRules.SetCustomGameSetupTimeout(0);
        GameRules.SetHeroSelectionTime(0);
        GameRules.SetStrategyTime(0);  // ⭐ 新增
        GameRules.SetShowcaseTime(0);
        GameRules.SetPreGameTime(0);
        GameRules. SetPostGameTime(30);
        GameRules.SetSameHeroSelectionEnabled(true);
        GameRules. SetStartingGold(0);
        GameRules.SetGoldTickTime(0);
        GameRules.SetGoldPerTick(0);
        GameRules.SetHeroRespawnEnabled(false);
        GameRules.SetCustomGameAllowMusicAtGameStart(false);
        GameRules.SetCustomGameAllowHeroPickMusic(false);
        GameRules. SetCustomGameAllowBattleMusic(false);
        GameRules.SetUseUniversalShopMode(true);
        GameRules.SetHideKillMessageHeaders(true);

        const game: CDOTABaseGameMode = GameRules.GetGameModeEntity();
        game.SetRemoveIllusionsOnDeath(true);
        game.SetSelectionGoldPenaltyEnabled(false);
        game.SetLoseGoldOnDeath(false);
        game.SetBuybackEnabled(false);
        game.SetDaynightCycleDisabled(true);
        game.SetForceRightClickAttackDisabled(true);
        game. SetHudCombatEventsDisabled(true);
        
        // ⭐ 保持强制英雄，确保玩家有英雄
        game.SetCustomGameForceHero('npc_dota_hero_axe');
        
        game.SetDaynightCycleDisabled(true);
        game.SetDeathOverlayDisabled(true);

        GameRules.SetCustomGameTeamMaxPlayers(DotaTeam.GOODGUYS, 5);
        GameRules. SetCustomGameTeamMaxPlayers(DotaTeam. BADGUYS, 0);
    }
}