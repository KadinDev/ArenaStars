import { useEffect } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { ShieldCheck } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { queryClient } from "@/storage/queryClient";
import { queryKeys } from "@/services/queries";

export default function SplashScreen() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.08, { duration: 650 }), withTiming(1, { duration: 650 })), -1, true);
    const timeout = setTimeout(() => {
      queryClient.getQueryData(queryKeys.organizations);
      router.replace("/(tabs)");
    }, 950);

    return () => clearTimeout(timeout);
  }, [scale]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <Animated.View style={logoStyle} className="h-28 w-28 items-center justify-center rounded-lg bg-card">
        <ShieldCheck color={colors.primary} size={54} />
      </Animated.View>
      <Animated.Text entering={FadeInDown.duration(450)} className="mt-6 text-4xl font-black text-text">
        Nossa Pelada
      </Animated.Text>
      <Animated.View entering={FadeIn.delay(250)} className="mt-3">
        <Text className="text-center text-sm text-textSecondary">Cache local pronto. Atualizacao silenciosa em segundo plano.</Text>
      </Animated.View>
    </View>
  );
}
