/*
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { NativeEventEmitter, NativeModules } from 'react-native';

const { AdMobModule } = NativeModules;

class AdMobNativeEventEmitter extends NativeEventEmitter {
  constructor() {
    super(AdMobModule);
    this.ready = false;
  }

  addListener(eventType, listener, context) {
    if (!this.ready) {
      AdMobModule.eventsNotifyReady(true);
      this.ready = true;
    }
    AdMobModule.eventsAddListener(eventType);

    let subscription = super.addListener(`admob_${eventType}`, listener, context);

    // React Native 0.65+ altered EventEmitter:
    // - removeSubscription is gone
    // - addListener returns an unsubscriber instead of a more complex object with eventType etc

    // make sure eventType for backwards compatibility just in case
    subscription.eventType = `admob_${eventType}`;

    // New style is to return a remove function on the object, just in csae people call that,
    // we will modify it to do our native unsubscription then call the original
    let originalRemove = subscription.remove;
    let newRemove = () => {
      AdMobModule.eventsRemoveListener(eventType, false);
      if (super.removeSubscription != null) {
        // This is for RN <= 0.64 - 65 and greater no longer have removeSubscription
        super.removeSubscription(subscription);
      } else if (originalRemove != null) {
        // This is for RN >= 0.65
        originalRemove();
      }
    };
    subscription.remove = newRemove;
    return subscription;
  }

  removeAllListeners(eventType) {
    AdMobModule.eventsRemoveListener(eventType, true);
    super.removeAllListeners(`admob_${eventType}`);
  }

  // This is likely no longer ever called, but it is here for backwards compatibility with RN <= 0.64
  removeSubscription(subscription) {
    AdMobModule.eventsRemoveListener(subscription.eventType.replace('admob_'), false);
    if (super.removeSubscription) {
      super.removeSubscription(subscription);
    }
  }
}

export default new AdMobNativeEventEmitter();