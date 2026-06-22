import { useAuth } from '@clerk/expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { premiumPricingPlan, subscriptionPlans, useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';
function FeatureCard({ COLORS, FONTS, icon, iconBg, iconColor, title, description, visualType }) {
    return (
        <View style={[styles.featureCard, { backgroundColor: COLORS.card, borderColor: COLORS.border, shadowColor: COLORS.textPrimary }]}>
            <View style={[styles.featureIcon, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={22} color={iconColor} />
            </View>
            <Text style={[styles.featureTitle, FONTS.cardTitle, { color: COLORS.textPrimary }]}>{title}</Text>
            <Text style={[styles.featureDescription, FONTS.bodyText, { color: COLORS.textSecondary }]}>{description}</Text>
            <View style={[styles.visualPanel, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
                {visualType === 'analytics' && (
                    <View style={styles.chartRow}>
                        {[42, 58, 72, 45, 86, 30, 95].map((h, idx) => (
                            <View key={`bar-${title}-${idx}`} style={styles.chartColumn}>
                                <View style={[styles.chartBar, { height: h, backgroundColor: idx % 2 === 0 ? COLORS.primaryContainer : COLORS.primary }]} />
                            </View>
                        ))}
                    </View>
                )}
                {visualType === 'meal' && (
                    <View style={styles.foodVisualWrap}>
                        <LinearGradient colors={[COLORS.primaryContainer, COLORS.surface]} style={styles.foodGlow} />
                        <Text style={styles.foodEmoji}>🥗</Text>
                        <Text style={styles.foodEmojiSecondary}>🍣</Text>
                        <Text style={styles.foodEmojiSecondaryAlt}>🍓</Text>
                    </View>
                )}
                {visualType === 'focus' && (
                    <View style={styles.focusVisualWrap}>
                        <View style={[styles.focusShield, { backgroundColor: COLORS.primaryContainer }]}>
                            <Ionicons name="shield-checkmark-outline" size={36} color={COLORS.primary} />
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}
function PlanCard({ plan, isSelected, COLORS, FONTS, onPress }) {
    const label = plan.id === 'yearly' ? 'ANNUAL ACCESS' : plan.id === 'monthly' ? 'MONTHLY' : 'WEEKLY';
    const suffix = plan.id === 'yearly' ? '/year' : plan.id === 'monthly' ? '/month' : '/week';
    const equivalent = plan.id === 'yearly' ? '$4.99/month' : plan.id === 'monthly' ? '$9.99/month' : '$0.25/day';
    return (
        <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={[styles.planCard, { backgroundColor: COLORS.card, borderColor: isSelected ? COLORS.primary : COLORS.border, shadowColor: COLORS.textPrimary, shadowOpacity: isSelected ? 0.14 : 0.08 }]}>
            <View style={styles.planTopRow}>
                <View>
                    <Text style={[styles.planLabel, FONTS.smallText, { color: COLORS.textMuted }]}>{label}</Text>
                    <View style={styles.planTitleRow}>
                        <Text style={[styles.planPrice, FONTS.mediumNumbers, { color: COLORS.textPrimary }]}>{plan.price}</Text>
                        <Text style={[styles.planUnit, FONTS.bodyText, { color: COLORS.textSecondary }]}>{suffix}</Text>
                    </View>
                    <Text style={[styles.planSubCopy, FONTS.smallText, { color: COLORS.textSecondary }]}>Equivalent to just {equivalent}</Text>
                </View>
                {plan.badge ? (
                    <View style={[styles.planBadge, { backgroundColor: COLORS.primary }]}>
                        <Text style={styles.planBadgeText}>{plan.badge === 'BEST VALUE' ? 'SAVE 40%' : plan.badge}</Text>
                    </View>
                ) : null}
            </View>
            <View style={styles.featureList}>
                {plan.features.map((feature) => (
                    <View key={`${plan.id}-${feature}`} style={styles.planFeatureRow}>
                        <View style={[styles.checkCircle, { borderColor: isSelected ? COLORS.primary : COLORS.textMuted }]}>
                            <Ionicons name="checkmark" size={12} color={isSelected ? COLORS.primary : COLORS.textMuted} />
                        </View>
                        <Text style={[styles.planFeatureText, FONTS.bodyText, { color: COLORS.textPrimary }]}>{feature}</Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
}
export default function PaywallScreen({ navigation }) {
    const { COLORS, FONTS, isDark } = useTheme();
    const { isSignedIn } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [isProcessing, setIsProcessing] = useState(false);
    const isGuestMode = useHealthStore((state) => state.isGuestMode);
    const setPremiumStatus = useHealthStore((state) => state.setPremiumStatus);
    const isAuthenticated = isSignedIn || isGuestMode;
    const featuredCards = useMemo(() => ([
        { key: 'analytics', icon: 'analytics-outline', iconBg: COLORS.primaryContainer, iconColor: COLORS.primary, title: 'Advanced Analytics', description: 'Deep dive into your health trends with predictive modeling and metabolic tracking charts.', visualType: 'analytics' },
        { key: 'meal', icon: 'restaurant-outline', iconBg: COLORS.tertiaryContainer, iconColor: COLORS.tertiary, title: 'AI Meal Planning', description: 'Custom nutrition plans that adapt to your progress, allergies, and daily energy expenditure.', visualType: 'meal' },
        { key: 'focus', icon: 'shield-checkmark-outline', iconBg: COLORS.secondaryContainer, iconColor: COLORS.secondary, title: 'Seamless Ad-Free Focus', description: 'Zero interruptions. Just you and your wellness journey, optimized for maximum focus.', visualType: 'focus' },
    ]), [COLORS.primaryContainer, COLORS.secondaryContainer, COLORS.tertiaryContainer, COLORS.primary, COLORS.secondary, COLORS.tertiary]);
    const handlePurchase = () => {
        if (!isAuthenticated) {
            navigation.navigate('LoginNavigator');
            return;
        }
        setIsProcessing(true);
        // Mocking external payment gateway processing latency
        setTimeout(() => {
            setPremiumStatus(true);
            setIsProcessing(false);
            Alert.alert('Transaction Successful', `Welcome to HealthMate Premium (${selectedPlan.toUpperCase()}). All tools unlocked.`);
            navigation.goBack();
        }, 1200);
    };
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
            <ScrollView contentContainerStyle={[styles.content, { paddingTop: 18 }]} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.avatar, { backgroundColor: COLORS.surface }]}>
                            <Text style={{ fontSize: 20 }}>👩‍🦰</Text>
                        </View>
                        <Text style={[styles.brandName, FONTS.sectionHeading, { color: COLORS.primary }]}>HealthMate AI</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.8} style={styles.headerIconButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="close-outline" size={26} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.heroSection}>
                    <View style={[styles.premiumPill, { backgroundColor: COLORS.warning }]}>
                        <Text style={[styles.premiumPillText, { color: isDark ? '#1F2937' : '#5A3400' }]}>PREMIUM</Text>
                    </View>
                    <Text style={[styles.heroTitle, FONTS.mainHeading, { color: COLORS.textPrimary }]}>Unlock Your Full Health Potential</Text>
                    <Text style={[styles.heroSubtitle, FONTS.bodyText, { color: COLORS.textSecondary }]}>Experience HealthMate without limits. Advanced tools designed to help you reach your goals faster.</Text>
                </View>
                <View style={styles.featureListWrap}>
                    {featuredCards.map((card) => (
                        <FeatureCard
                            key={card.key}
                            COLORS={COLORS}
                            FONTS={FONTS}
                            icon={card.icon}
                            iconBg={card.iconBg}
                            iconColor={card.iconColor}
                            title={card.title}
                            description={card.description}
                            visualType={card.visualType}
                        />
                    ))}
                </View>
                <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Choose Your Plan</Text>
                <View style={styles.planList}>
                    {subscriptionPlans.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} isSelected={selectedPlan === plan.id} COLORS={COLORS} FONTS={FONTS} onPress={() => setSelectedPlan(plan.id)} />
                    ))}
                </View>
                <TouchableOpacity activeOpacity={0.9} onPress={handlePurchase} style={styles.ctaWrap} disabled={isProcessing}>
                    <LinearGradient colors={[COLORS.primary, COLORS.primary]} style={styles.ctaButton}>
                        {isProcessing ? (
                            <ActivityIndicator color={COLORS.onPrimary || '#FFFFFF'} />
                        ) : (
                            <Text style={[styles.ctaText, FONTS.buttonText, { color: COLORS.onPrimary || '#FFFFFF' }]}>{premiumPricingPlan.trial}</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
                <Text style={[styles.ctaSubtext, FONTS.smallText, { color: COLORS.textMuted }]}>No commitment. Cancel anytime before your trial ends to avoid being charged.</Text>
                <View style={styles.footerLinks}>
                    <TouchableOpacity activeOpacity={0.8}><Text style={[styles.footerLink, FONTS.smallText, { color: COLORS.textMuted }]}>Restore</Text></TouchableOpacity>
                    <Text style={[styles.footerDot, { color: COLORS.textMuted }]}>•</Text>
                    <TouchableOpacity activeOpacity={0.8}><Text style={[styles.footerLink, FONTS.smallText, { color: COLORS.textMuted }]}>Terms</Text></TouchableOpacity>
                    <Text style={[styles.footerDot, { color: COLORS.textMuted }]}>•</Text>
                    <TouchableOpacity activeOpacity={0.8}><Text style={[styles.footerLink, FONTS.smallText, { color: COLORS.textMuted }]}>Privacy</Text></TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 16, paddingBottom: 24, marginTop: 18 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 10, justifyContent: 'space-between' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '70%' },
    avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    brandName: { fontSize: 19, fontWeight: '800' },
    headerIconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    heroSection: { alignItems: 'center', marginBottom: 12 },
    premiumPill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, marginBottom: 14 },
    premiumPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
    heroTitle: { fontSize: 28, lineHeight: 34, textAlign: 'center', marginBottom: 12, maxWidth: 280 },
    heroSubtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 280 },
    featureListWrap: { gap: 12, marginTop: 10 },
    featureCard: { borderRadius: 16, borderWidth: 1, padding: 14, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
    featureIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    featureTitle: { fontSize: 18, marginBottom: 6 },
    featureDescription: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
    visualPanel: { height: 118, borderRadius: 12, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', width: '88%', height: '72%' },
    chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    chartBar: { width: 26, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    foodVisualWrap: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    foodGlow: { position: 'absolute', width: '100%', height: '100%', opacity: 0.4 },
    foodEmoji: { fontSize: 50, position: 'absolute', transform: [{ translateY: 6 }] },
    foodEmojiSecondary: { position: 'absolute', fontSize: 28, left: 42, bottom: 18, opacity: 0.9 },
    foodEmojiSecondaryAlt: { position: 'absolute', fontSize: 24, right: 38, bottom: 20, opacity: 0.9 },
    focusVisualWrap: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    focusShield: { width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { marginTop: 18, marginBottom: 12, fontSize: 22, textAlign: 'center' },
    planList: { gap: 12 },
    planCard: { borderRadius: 14, borderWidth: 1, padding: 16, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    planTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
    planLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, marginBottom: 4 },
    planTitleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    planPrice: { fontSize: 34, lineHeight: 38, fontWeight: '800' },
    planUnit: { marginBottom: 6 },
    planSubCopy: { marginTop: 4 },
    planBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, minWidth: 72, alignItems: 'center' },
    planBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
    featureList: { gap: 10 },
    planFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    checkCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    planFeatureText: { flex: 1, fontSize: 14 },
    ctaWrap: { marginTop: 22 },
    ctaButton: { minHeight: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    ctaText: { fontSize: 17, fontWeight: '800' },
    ctaSubtext: { textAlign: 'center', marginTop: 14, lineHeight: 18, maxWidth: 260, alignSelf: 'center' },
    footerLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, gap: 10 },
    footerLink: { fontWeight: '500' },
    footerDot: { fontSize: 12 },
});