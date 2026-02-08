"""
Service for calculating compatibility scores between users.
Translates the logic from the frontend TypeScript file into Python.
"""

def calculate_array_overlap(list1: list, list2: list) -> float:
    """
    Calculates the Jaccard Index (Overlap) between two lists.
    Returns a value between 0.0 and 1.0.
    """
    if not list1 or not list2:
        return 0.5  # Neutral if data is missing

    set1 = set(item.lower() for item in list1)
    set2 = set(item.lower() for item in list2)

    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))

    return intersection / union if union > 0 else 0

def calculate_budget_score(budget1: str, budget2: str) -> float:
    """
    Calculates alignment between budget preferences.
    Returns: 1.0 (Perfect), 0.8 (Flexible), 0.5 (Adjacent), 0.2 (Mismatch)
    """
    if budget1 == budget2:
        return 1.0
    if budget1 == 'flexible' or budget2 == 'flexible':
        return 0.8
    
    # Define the order of budgets to check "adjacency"
    budget_order = ['under40', '40to80', 'flexible']
    
    try:
        idx1 = budget_order.index(budget1)
        idx2 = budget_order.index(budget2)
        # If they are 1 step apart (e.g. under40 vs 40to80), give partial points
        return 0.5 if abs(idx1 - idx2) == 1 else 0.2
    except ValueError:
        return 0.2 # Fallback if budget string is unknown

def calculate_compatibility(user_a: dict, user_b: dict) -> int:
    """
    Generates a 0-100 compatibility score between two user documents.
    """
    score = 0.0
    total_weight = 0.0

    # 1. Music Taste (Genres) - Weight: 30
    genres_a = user_a.get('music_preferences', {}).get('genres', [])
    genres_b = user_b.get('music_preferences', {}).get('genres', [])
    score += calculate_array_overlap(genres_a, genres_b) * 30
    total_weight += 30

    # 2. Music Taste (Artists) - Weight: 25
    artists_a = user_a.get('music_preferences', {}).get('artists', [])
    artists_b = user_b.get('music_preferences', {}).get('artists', [])
    score += calculate_array_overlap(artists_a, artists_b) * 25
    total_weight += 25

    # 3. Budget Alignment - Weight: 20
    budget_a = user_a.get('budget', 'flexible')
    budget_b = user_b.get('budget', 'flexible')
    score += calculate_budget_score(budget_a, budget_b) * 20
    total_weight += 20

    # 4. Concert Vibes - Weight: 25
    vibes_a = user_a.get('concert_vibes', [])
    vibes_b = user_b.get('concert_vibes', [])
    score += calculate_array_overlap(vibes_a, vibes_b) * 25
    total_weight += 25

    return int(score) # Returns 0 to 100
    