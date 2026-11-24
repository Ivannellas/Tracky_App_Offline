import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let Notifications = null;
let androidChannelReady = false;

try {
  const { setNotificationHandler } = require('expo-notifications/build/NotificationsHandler');
  const { scheduleNotificationAsync } = require('expo-notifications/build/scheduleNotificationAsync');
  const { cancelScheduledNotificationAsync } = require('expo-notifications/build/cancelScheduledNotificationAsync');
  const { cancelAllScheduledNotificationsAsync } = require('expo-notifications/build/cancelAllScheduledNotificationsAsync');
  const { getPermissionsAsync, requestPermissionsAsync } = require('expo-notifications/build/NotificationPermissions');
  const { setNotificationChannelAsync } = require('expo-notifications/build/setNotificationChannelAsync');
  const { AndroidImportance, SchedulableTriggerInputTypes } = require('expo-notifications/build/Notifications.types');

  Notifications = {
    setNotificationHandler,
    scheduleNotificationAsync,
    cancelScheduledNotificationAsync,
    cancelAllScheduledNotificationsAsync,
    getPermissionsAsync,
    requestPermissionsAsync,
    setNotificationChannelAsync,
    AndroidImportance,
    SchedulableTriggerInputTypes,
  };
} catch (err) {
  console.warn('expo-notifications submodules unavailable in this runtime:', err?.message);
}

const SAVINGS_CHANNEL_ID = 'savings-reminders';
const PAYDAY_NOTIFICATION_IDS_KEY = '@trackly_payday_notification_ids';
const EXPENSE_NOTIFICATION_IDS_KEY = '@trackly_expense_notification_ids';
const ADVICE_NOTIFICATION_ID_KEY = '@trackly_advice_notification_id';
const ADVICE_QUEUE_KEY = '@trackly_advice_queue_v1';

const EXPENSE_TRACKING_NUDGES = [
  'Midday check-in: have you logged your morning coffee, fare, or lunch in Trackly yet?',
  'Evening wrap-up: take 30 seconds to record today’s expenses before your balance gets blurry.',
];

const FINANCIAL_ADVICE_POOL = [
  'Pay yourself first on payday—move even a small fixed amount into savings before daily spending starts.',
  'Use a 24-hour pause rule for unplanned buys; if you still want it tomorrow, decide with intention.',
  'Small daily leaks like extra snacks, delivery fees, or impulse add-ons often cost more than big bills.',
  'Know your remaining cycle budget before dining out or shopping so one day does not squeeze the rest of the period.',
  'Build a starter emergency cushion first—unexpected repairs or medical costs hit harder without a buffer.',
  'Round up expenses mentally to the nearest ₱50 or ₱100 and see how much spare change you could stash.',
  'Separate wants from needs when reviewing spending—cutting even two non-essentials frees real cash.',
  'Check your recurring bills early in the cycle so fixed commitments never catch you off guard.',
  'A small automatic savings habit done every payday beats waiting for leftover cash at the end of the month.',
  'Compare prices or wait for a real sale rather than buying just because something is discounted.',
  'Keep a dedicated savings buffer untouched by everyday wallet spending so your progress stays visible.',
  'Before upgrading a phone, gadget, or gear, ask if your current one still covers what you actually need.',
  'Track cash spending right away—cash slips out faster than digital transfers because there is no receipt trail.',
  'Set a soft daily spending cap for variable extras like food, coffee, and convenience runs.',
  'When income or bonuses arrive, allocate a percentage to savings immediately before lifestyle creep sets in.',
  'Review one spending category each week to spot easy wins without overhauling your whole routine.',
  'Avoid buying in bulk unless you genuinely use the item regularly and the unit cost actually saves money.',
  'Give every peso a job at the start of the cycle—unplanned money is the easiest money to spend.',
  'Celebrate staying under budget at the end of a cycle by stashing part of the leftover amount.',
  'Consistency matters more than big one-off deposits—even ₱100 or ₱200 per cycle builds momentum.',
  'Watch out for subscription creep—cancel recurring apps or services you have not used this month.',
  'Plan meals or groceries with a quick list so you do not buy extra items while hungry or rushed.',
  'Treat your savings goal like a non-negotiable bill you pay to your future self.',
  'Pause before tapping checkout—ask if this purchase moves you closer to or further from your goals.',
  'Look at your spending trends monthly, not just day by day, to see real patterns taking shape.',
  'Track every peso—awareness alone naturally cuts down impulsive spending.',
  'Never shop or browse online stores when you are bored, stressed, or hungry.',
  'Follow the 50/30/20 rule as a baseline: 50% needs, 30% wants, 20% savings.',
  'Keep your emergency fund in a separate wallet or account so you are not tempted to spend it.',
  'Wait at least 48 hours before buying any non-essential item over ₱500.',
  'Small daily habits like making coffee at home can save thousands over a few months.',
  'Before buying something on sale, ask yourself if you would still buy it at full price.',
  'Pay off high-interest debt first—interest works against your future savings.',
  'Increase your savings rate whenever you get a raise or extra income instead of upgrading your lifestyle.',
  'Set a weekly cash allowance for casual spending; when it is gone, pause until next week.',
  'Review your top three expense categories this month and pick one to trim by 10%.',
  'Always check your wallet balance before going out with friends so you set a clear limit.',
  'Automate or schedule your savings right on payday so you never rely on willpower alone.',
  'Avoid using "Buy Now, Pay Later" for wants—future paydays belong to future goals.',
  'Progress beats perfection: even saving ₱50 a day adds up to ₱1,500 a month.',
];

export function isNotificationsAvailable() {
  return Boolean(Notifications && typeof Notifications.scheduleNotificationAsync === 'function');
}

export async function initNotificationHandler() {
  if (!isNotificationsAvailable()) return false;

  try {
    if (typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }
  } catch (err) {
    console.warn('Failed to set notification handler:', err?.message);
  }

  if (Platform.OS === 'android' && typeof Notifications.setNotificationChannelAsync === 'function') {
    try {
      await Notifications.setNotificationChannelAsync(SAVINGS_CHANNEL_ID, {
        name: 'Savings & Payday Nudges',
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
      });
      androidChannelReady = true;
    } catch (err) {
      androidChannelReady = false;
      console.warn('Android notification channel unavailable in this runtime:', err?.message);
    }
  }

  return true;
}

function getAndroidChannelOption() {
  return Platform.OS === 'android' && androidChannelReady ? { channelId: SAVINGS_CHANNEL_ID } : {};
}

export async function requestNotificationPermission() {
  if (!isNotificationsAvailable()) return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Permission request error:', err?.message);
    return false;
  }
}

function buildShuffledIndices(length, excludeIndex = -1) {
  const indices = Array.from({ length }, (_, idx) => idx).filter((idx) => idx !== excludeIndex);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

async function getNextRandomAdvice() {
  try {
    const raw = await AsyncStorage.getItem(ADVICE_QUEUE_KEY);
    let parsed = raw ? JSON.parse(raw) : null;

    if (!parsed || !Array.isArray(parsed.queue) || parsed.queue.length === 0) {
      const lastIndex = typeof parsed?.lastIndex === 'number' ? parsed.lastIndex : -1;
      parsed = {
        queue: buildShuffledIndices(FINANCIAL_ADVICE_POOL.length, lastIndex),
        lastIndex,
      };
    }

    const nextIndex = parsed.queue.shift();
    await AsyncStorage.setItem(
      ADVICE_QUEUE_KEY,
      JSON.stringify({ queue: parsed.queue, lastIndex: nextIndex })
    );

    return FINANCIAL_ADVICE_POOL[nextIndex] ?? FINANCIAL_ADVICE_POOL[0];
  } catch {
    const randomIdx = Math.floor(Math.random() * FINANCIAL_ADVICE_POOL.length);
    return FINANCIAL_ADVICE_POOL[randomIdx];
  }
}

async function cancelIdsFromStorage(storageKey) {
  if (!isNotificationsAvailable()) return false;

  try {
    const raw = await AsyncStorage.getItem(storageKey);
    const ids = raw ? JSON.parse(raw) : [];

    if (Array.isArray(ids) && ids.length > 0 && typeof Notifications.cancelScheduledNotificationAsync === 'function') {
      for (const id of ids) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch {
          // Ignore already-fired or missing IDs
        }
      }
    }

    await AsyncStorage.removeItem(storageKey);
    return true;
  } catch (err) {
    console.warn(`Failed to cancel notifications for ${storageKey}:`, err?.message);
    return false;
  }
}

export async function cancelPaydayReminders() {
  return cancelIdsFromStorage(PAYDAY_NOTIFICATION_IDS_KEY);
}

export async function cancelTwiceDailyExpenseReminders() {
  return cancelIdsFromStorage(EXPENSE_NOTIFICATION_IDS_KEY);
}

export async function cancelDailyFinancialAdvice() {
  if (!isNotificationsAvailable()) return false;

  try {
    const existingId = await AsyncStorage.getItem(ADVICE_NOTIFICATION_ID_KEY);
    if (existingId && typeof Notifications.cancelScheduledNotificationAsync === 'function') {
      try {
        await Notifications.cancelScheduledNotificationAsync(existingId);
      } catch {
        // Ignore already-fired or missing IDs
      }
    }
    await AsyncStorage.removeItem(ADVICE_NOTIFICATION_ID_KEY);
    return true;
  } catch (err) {
    console.warn('Failed to cancel daily financial advice:', err?.message);
    return false;
  }
}

/**
 * Schedules expense-tracking reminders twice a day (1:00 PM and 8:30 PM by default).
 */
export async function scheduleTwiceDailyExpenseReminders(
  slots = [
    { hour: 13, minute: 0, body: EXPENSE_TRACKING_NUDGES[0] },
    { hour: 20, minute: 30, body: EXPENSE_TRACKING_NUDGES[1] },
  ]
) {
  const ready = await initNotificationHandler();
  if (!ready) {
    return { ok: false, reason: 'Notifications are not supported in this current runtime.' };
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    return { ok: false, reason: 'Notification permission was not granted.' };
  }

  try {
    await cancelTwiceDailyExpenseReminders();

    const scheduledIds = [];
    const triggerType = Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily';

    for (const slot of slots) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Track Your Expenses',
          body: slot.body,
          sound: true,
          ...getAndroidChannelOption(),
        },
        trigger: {
          type: triggerType,
          hour: slot.hour,
          minute: slot.minute,
        },
      });

      if (id) scheduledIds.push(id);
    }

    await AsyncStorage.setItem(EXPENSE_NOTIFICATION_IDS_KEY, JSON.stringify(scheduledIds));
    return { ok: true, ids: scheduledIds };
  } catch (err) {
    return { ok: false, reason: err?.message || 'Unable to schedule expense reminders.' };
  }
}

/**
 * Schedules a daily financial advice notification (2:30 PM by default) with shuffled non-repeating tips.
 */
export async function scheduleDailyFinancialAdvice(hour = 14, minute = 30) {
  const ready = await initNotificationHandler();
  if (!ready) {
    return { ok: false, reason: 'Notifications are not supported in this current runtime.' };
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    return { ok: false, reason: 'Notification permission was not granted.' };
  }

  try {
    await cancelDailyFinancialAdvice();

    const adviceText = await getNextRandomAdvice();
    const triggerType = Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily';

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Financial Advice',
        body: adviceText,
        sound: true,
        ...getAndroidChannelOption(),
      },
      trigger: {
        type: triggerType,
        hour,
        minute,
      },
    });

    if (id) {
      await AsyncStorage.setItem(ADVICE_NOTIFICATION_ID_KEY, id);
    }

    return { ok: true, id, advice: adviceText };
  } catch (err) {
    return { ok: false, reason: err?.message || 'Unable to schedule daily financial advice.' };
  }
}

/**
 * Triggers a local savings/expense reminder after `seconds` (default 5s) for easy testing.
 */
export async function triggerTestSavingsNotification(seconds = 5) {
  const ready = await initNotificationHandler();
  if (!ready) {
    return { ok: false, reason: 'Notifications are not supported in this current runtime.' };
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    return { ok: false, reason: 'Notification permission was not granted.' };
  }

  try {
    const sampleAdvice = await getNextRandomAdvice();
    const triggerType = Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval';
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Trackly Money & Expense Check',
        body: sampleAdvice,
        sound: true,
        ...getAndroidChannelOption(),
      },
      trigger: {
        type: triggerType,
        seconds,
        repeats: false,
      },
    });

    return { ok: true, id };
  } catch (err) {
    return { ok: false, reason: err?.message || 'Unable to schedule notification.' };
  }
}

/**
 * Schedules recurring bi-monthly payday savings reminders (1st and 16th at 9:00 AM).
 */
export async function scheduleBiMonthlyPaydayReminders() {
  const ready = await initNotificationHandler();
  if (!ready) {
    return { ok: false, reason: 'Notifications are not supported in this current runtime.' };
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    return { ok: false, reason: 'Notification permission was not granted.' };
  }

  try {
    await cancelPaydayReminders();

    const scheduledIds = [];
    const paydayDays = [1, 16];
    const triggerType = Notifications.SchedulableTriggerInputTypes?.MONTHLY ?? 'monthly';

    for (const day of paydayDays) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Payday Savings Reminder',
          body:
            day === 1
              ? '1st Payday cycle started—pay yourself first before daily expenses add up.'
              : '16th Payday cycle started—stash a portion toward your savings goal today.',
          sound: true,
          ...getAndroidChannelOption(),
        },
        trigger: {
          type: triggerType,
          day,
          hour: 9,
          minute: 0,
        },
      });

      if (id) scheduledIds.push(id);
    }

    await AsyncStorage.setItem(PAYDAY_NOTIFICATION_IDS_KEY, JSON.stringify(scheduledIds));
    return { ok: true, ids: scheduledIds };
  } catch (err) {
    return { ok: false, reason: err?.message || 'Unable to schedule payday reminders.' };
  }
}