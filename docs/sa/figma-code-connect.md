# Figma V2 ↔ code component map

Figma file: [Tanlabs English Design](https://www.figma.com/design/wrBVw3z5sidRwZcsKiPlzv) (V2).

Code Connect API maps require a Figma Org/Enterprise Dev seat; until available, keep this table as the SoT for matching.

| Figma component               | Node       | Code path                                                         |
| ----------------------------- | ---------- | ----------------------------------------------------------------- |
| `Button/AppButton`            | `11:45`    | `src/components/ui/button/AppButton.tsx`                          |
| `Input/AppTextInput`          | `11:67`    | `src/components/ui/input/AppTextInput.tsx` + `FieldTextInput.tsx` |
| `Input/OtpPinInput`           | `215:851`  | `src/features/auth/components/OtpPinInput.tsx`                    |
| `Typography/AppText`          | `221:1242` | `src/components/ui/typography/AppText.tsx`                        |
| `Selection/AnswerOption`      | `11:80`    | `src/components/ui/selection/AnswerOption.tsx`                    |
| `Selection/AppSwitch`         | `42:91`    | `src/components/ui/selection/AppSwitch.tsx`                       |
| `Selection/SegmentedControl`  | `280:578`  | `src/components/ui/selection/SegmentedControl.tsx`                |
| `Navigation/TopAppHeader`     | `11:114`   | `src/components/ui/navigation/TopAppHeader.tsx`                   |
| `Navigation/BottomNavigation` | `11:195`   | `src/components/ui/navigation/BottomNavigation.tsx`               |
| `Feedback/BrandLoading`       | `162:86`   | `src/components/ui/feedback/BrandLoading.tsx`                     |
| `Feedback/ConfirmModal`       | `93:534`   | `src/components/ui/feedback/ConfirmModal.tsx`                     |
| `Pattern/StreakCard`          | Home card  | `src/features/home/components/StreakCard.tsx`                     |
| Streak unlocked (Result)      | `364:684`  | `src/features/home/components/StreakReachedModal.tsx`             |
| `Feedback/ResultMetric`       | `104:71`   | `src/components/ui/learning/ResultMetric.tsx`                     |
| `Pattern/LessonCard`          | `11:105`   | `src/features/grammar/components/GrammarTopicCard.tsx`            |
| `Pattern/LevelSectionHeader`  | `250:332`  | `src/features/vocabulary/components/LevelSectionHeader.tsx`       |
| `Vocabulary/TermRow`          | `265:333`  | `src/features/vocabulary/components/TermRow.tsx`                  |

Theme tokens: `src/theme/palette.ts` + `src/theme/index.ts` mirror Figma collections `Primitives/Color`, `Semantic/Color`, `Primitives/Spacing`, `Primitives/Radius`, and text styles `Text/*`.
