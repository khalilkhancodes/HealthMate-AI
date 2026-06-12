// Script to update HomeScreen.js with real NVIDIA API call

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/screens/HomeScreen.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the mock AI logic with real NVIDIA API call
const oldLogic = `onPress={async () => {
                  if (isAiLoading) return;
                  setIsAiLoading(true);

                  try {
                    const aiResponse = await new Promise((resolve) => {
                      setTimeout(() => {
                        const stepsPerformance = dailySteps / Math.max(1, stepGoal || 6000);
                        const waterPerformance = currentWaterMl / Math.max(1, waterGoal || 2500);
                        const sleepPerformance = sleepDuration / Math.max(1, sleepGoal || 8);

                        const avgPerformance = (stepsPerformance + waterPerformance + sleepPerformance) / 3;
                        const boost = avgPerformance >= 1 ? 1.08 : avgPerformance >= 0.8 ? 1.03 : 0.95;

                        const suggestedSteps = Math.max(
                          3000,
                          Math.min(20000, Math.round(((stepGoal || 6000) * boost) / 100) * 100)
                        );
                        const suggestedWaterMl = Math.max(
                          1000,
                          Math.min(6000, Math.round(((waterGoal || 2500) * boost) / 250) * 250)
                        );
                        const suggestedSleepHours = Math.max(
                          4,
                          Math.min(12, Math.round(((sleepGoal || 8) * (avgPerformance >= 1 ? 1.03 : 0.97)) * 2) / 2)
                        );

                        resolve({
                          suggestedStepGoal: suggestedSteps,
                          suggestedWaterGoalMl: suggestedWaterMl,
                          suggestedSleepGoalHours: suggestedSleepHours,
                        });
                      }, 1500);
                    });

                    setReviewStepGoal(aiResponse.suggestedStepGoal);
                    setReviewWaterGoal(aiResponse.suggestedWaterGoalMl / 1000);
                    setReviewSleepGoal(aiResponse.suggestedSleepGoalHours);
                  } catch (error) {
                    console.warn('AI suggestion failed', error);
                  } finally {
                    setIsAiLoading(false);
                  }
                }}`;

const newLogic = `onPress={async () => {
                  if (isAiLoading) return;
                  setIsAiLoading(true);

                  try {
                    // NVIDIA LLM API Configuration
                    const NVIDIA_INVOKE_URL = process.env.EXPO_PUBLIC_NVIDIA_INVOKE_URL;
                    const NVIDIA_MODEL = process.env.EXPO_PUBLIC_NVIDIA_MODEL;
                    const NVIDIA_API_KEY = process.env.EXPO_PUBLIC_NVIDIA_API_KEY;

                    if (!NVIDIA_INVOKE_URL || !NVIDIA_API_KEY) {
                      throw new Error('Missing NVIDIA API configuration');
                    }

                    const headers = {
                      Authorization: \`Bearer \${NVIDIA_API_KEY}\`,
                      'Content-Type': 'application/json',
                      Accept: 'application/json',
                    };

                    const systemPrompt = \`You are a fitness AI assistant. Based on the user's health metrics, suggest optimal daily goals in strict JSON format only:
{
  "suggestedStepGoal": <number>,
  "suggestedWaterGoalMl": <number>,
  "suggestedSleepGoalHours": <number>
}
Constraints: Steps 3000-20000, Water 1000-6000ml, Sleep 4-12 hours. Return ONLY valid JSON.\`;

                    const userMessage = \`Yesterday's health metrics:
- Steps: \${dailySteps}
- Water consumed: \${currentWaterMl}ml
- Sleep duration: \${sleepDuration} hours

Current goals: \${stepGoal} steps, \${waterGoal}ml water, \${sleepGoal} hours sleep.

Suggest optimized goals for today based on yesterday's performance.\`;

                    const payload = {
                      model: NVIDIA_MODEL,
                      messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage },
                      ],
                      max_tokens: 200,
                      temperature: 0.7,
                      top_p: 0.9,
                      stream: false,
                    };

                    const response = await axios.post(NVIDIA_INVOKE_URL, payload, { headers });
                    const aiText = response.data?.choices?.[0]?.message?.content || '';

                    // Parse JSON response from LLM
                    const jsonMatch = aiText.match(/\\{[\\s\\S]*\\}/);
                    if (!jsonMatch) {
                      throw new Error('AI response did not contain valid JSON');
                    }

                    const aiResponse = JSON.parse(jsonMatch[0]);

                    // Validate and apply suggestions
                    const suggestedSteps = Math.max(3000, Math.min(20000, Math.round(aiResponse.suggestedStepGoal) || stepGoal));
                    const suggestedWaterMl = Math.max(1000, Math.min(6000, Math.round(aiResponse.suggestedWaterGoalMl) || waterGoal));
                    const suggestedSleep = Math.max(4, Math.min(12, parseFloat(aiResponse.suggestedSleepGoalHours) || sleepGoal));

                    setReviewStepGoal(suggestedSteps);
                    setReviewWaterGoal(suggestedWaterMl / 1000);
                    setReviewSleepGoal(suggestedSleep);

                    console.log('[HomeScreen] AI suggestions applied:', { suggestedSteps, suggestedWaterMl, suggestedSleep });
                  } catch (error) {
                    console.warn('[HomeScreen] AI suggestion failed:', error.message);
                    // Silently fail - user can use "Keep Current" button
                  } finally {
                    setIsAiLoading(false);
                  }
                }}`;

if (content.includes(oldLogic)) {
  content = content.replace(oldLogic, newLogic);
  fs.writeFileSync(filePath, content);
  console.log('HomeScreen.js updated successfully');
} else {
  console.error('Could not find the expected code to replace');
  process.exit(1);
}
