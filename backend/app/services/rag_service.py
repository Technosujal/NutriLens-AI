import os
import json
import math
import logging
import asyncio
from typing import List, Dict, Any

import google.generativeai as genai

from app.services.gemini_service import GeminiService
from app.models.user import User
from app.models.meal import Meal
from app.models.water import WaterLog
from app.models.weight import WeightHistory
from sqlalchemy.orm import Session

logger = logging.getLogger("uvicorn.error")

EMBEDDING_MODEL_NAME = "models/gemini-embedding-001"

class RAGService:
    # Memory cache for static knowledge base embeddings and dynamic content
    _kb_chunks_cache: List[Dict[str, Any]] = []
    _embedding_cache: Dict[str, List[float]] = {}

    @classmethod
    def _is_configured(cls) -> bool:
        """Checks if the Gemini client is configured."""
        return GeminiService._is_configured()

    @classmethod
    async def _run_async(cls, func, *args, **kwargs):
        """Runs a blocking function in an executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: func(*args, **kwargs))

    @classmethod
    async def get_embedding(cls, text: str, is_query: bool = False) -> List[float]:
        """
        Generates a semantic embedding for the given text using the Gemini Embedding API.
        Caches in memory to strictly avoid rate limit / quota exhaustion.
        """
        cache_key = f"{'q_' if is_query else 'd_'}{text.strip()}"
        if cache_key in cls._embedding_cache:
            return cls._embedding_cache[cache_key]

        if not cls._is_configured():
            vector = cls._get_mock_embedding(text)
            cls._embedding_cache[cache_key] = vector
            return vector

        task_type = "retrieval_query" if is_query else "retrieval_document"
        try:
            result = await cls._run_async(
                genai.embed_content,
                model=EMBEDDING_MODEL_NAME,
                content=text,
                task_type=task_type
            )
            emb = result["embedding"]
            cls._embedding_cache[cache_key] = emb
            return emb
        except Exception as e:
            logger.warning(f"Gemini embedding API rate limit/error, using mock vector fallback: {e}")
            vector = cls._get_mock_embedding(text)
            cls._embedding_cache[cache_key] = vector
            return vector

    @classmethod
    def _get_mock_embedding(cls, text: str, dimensions: int = 768) -> List[float]:
        """Generates a deterministic pseudo-random embedding based on string hash for mock mode."""
        import random
        seed = hash(text) & 0xffffffff
        rng = random.Random(seed)
        vector = [rng.gauss(0, 1) for _ in range(dimensions)]
        magnitude = math.sqrt(sum(x * x for x in vector))
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
        return vector

    @classmethod
    def cosine_similarity(cls, v1: List[float], v2: List[float]) -> float:
        """Calculates cosine similarity between two numeric vectors."""
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot_product = sum(x * y for x, y in zip(v1, v2))
        magnitude1 = math.sqrt(sum(x * x for x in v1))
        magnitude2 = math.sqrt(sum(x * x for x in v2))
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        return dot_product / (magnitude1 * magnitude2)

    @classmethod
    async def load_kb_chunks(cls) -> List[Dict[str, Any]]:
        """Loads static nutrition knowledge base articles and generates/caches their embeddings."""
        if cls._kb_chunks_cache:
            return cls._kb_chunks_cache

        kb_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "resources", "nutrition_kb.json")
        chunks = []
        if os.path.exists(kb_path):
            try:
                with open(kb_path, "r", encoding="utf-8") as f:
                    articles = json.load(f)
                
                logger.info(f"Generating embeddings for {len(articles)} Knowledge Base articles...")
                
                tasks = []
                for item in articles:
                    chunk_text = f"Guide: {item['title']}. Category: {item['category']}. Content: {item['content']}"
                    tasks.append(cls.get_embedding(chunk_text, is_query=False))
                
                embeddings = await asyncio.gather(*tasks)

                for i, item in enumerate(articles):
                    chunk_text = f"Guide: {item['title']}. Category: {item['category']}. Content: {item['content']}"
                    chunks.append({
                        "content": chunk_text,
                        "embedding": embeddings[i],
                        "source": f"Guide: {item['title']}",
                        "type": "guide"
                    })
                cls._kb_chunks_cache = chunks
            except Exception as e:
                logger.error(f"Failed to load/embed static Knowledge Base: {e}")
        else:
            logger.warning(f"Knowledge base file not found at {kb_path}")
        
        return chunks

    @classmethod
    async def get_user_history_chunks(cls, user: User, db: Session) -> List[Dict[str, Any]]:
        """
        Dynamically extracts and constructs text chunks for the user's historical log context.
        """
        chunks = []
        embedding_tasks = {}

        # 1. User Profile Context
        profile_content = (
            f"User Profile Goal. User Name: {user.name or 'User'}. Age: {user.age or 'N/A'}. "
            f"Gender: {user.gender or 'N/A'}. Weight: {user.weight_kg or 'N/A'} kg. "
            f"Target Weight: {user.target_weight_kg or 'N/A'} kg. Primary Weight Goal: {user.weight_goal or 'N/A'}. "
            f"Daily Calorie Budget Goal: {user.calorie_goal or 'N/A'} kcal. "
            f"Daily Target Protein: {user.protein_goal_g or 'N/A'}g. Target Carbs: {user.carbs_goal_g or 'N/A'}g. "
            f"Target Fat: {user.fat_goal_g or 'N/A'}g. Dietary Preference: {user.diet_preference or 'N/A'}."
        )
        embedding_tasks['profile'] = (cls.get_embedding(profile_content, is_query=False), profile_content, "Your User Profile & Goals")

        # 2. Recent Meal Logs (top 6 recent meals)
        meals = db.query(Meal).filter(Meal.user_id == user.id).order_by(Meal.date.desc(), Meal.id.desc()).limit(6).all()
        for i, m in enumerate(meals):
            items_list = ", ".join([f"{item.food_name} ({item.quantity} {item.serving_size or 'serving'})" for item in m.items])
            meal_content = (
                f"Meal History. On date {m.date}, user logged a {m.meal_type} named '{m.name}' containing: {items_list}. "
                f"Total Meal Nutritional Values: Calories: {m.total_calories:.1f} kcal, "
                f"Protein: {m.total_protein:.1f}g, Carbs: {m.total_carbs:.1f}g, Fat: {m.total_fat:.1f}g."
            )
            source = f"Meal Log ({m.date} - {m.meal_type})"
            embedding_tasks[f'meal_{i}'] = (cls.get_embedding(meal_content, is_query=False), meal_content, source)

        # 3. Recent Water Logs (top 3 days)
        water_logs = db.query(WaterLog).filter(WaterLog.user_id == user.id).order_by(WaterLog.date.desc()).limit(3).all()
        for i, w in enumerate(water_logs):
            water_content = f"Hydration History. On date {w.date}, the user logged a total water consumption of {w.amount_ml} ml."
            source = f"Hydration Log ({w.date})"
            embedding_tasks[f'water_{i}'] = (cls.get_embedding(water_content, is_query=False), water_content, source)

        # 4. Recent Weight History (top 3 logs)
        weight_logs = db.query(WeightHistory).filter(WeightHistory.user_id == user.id).order_by(WeightHistory.date.desc()).limit(3).all()
        for i, wt in enumerate(weight_logs):
            weight_content = f"Body Weight History. On date {wt.date}, user's weight was logged as {wt.weight_kg} kg."
            source = f"Weight Log ({wt.date})"
            embedding_tasks[f'weight_{i}'] = (cls.get_embedding(weight_content, is_query=False), weight_content, source)
        
        # Run all embedding tasks concurrently
        results = await asyncio.gather(*[v[0] for v in embedding_tasks.values()])
        
        # Associate results back to their content and source
        keys = list(embedding_tasks.keys())
        for i, embedding in enumerate(results):
            key = keys[i]
            _, content, source = embedding_tasks[key]
            chunk_type = key.split('_')[0] + "_history" if '_' in key else "profile"
            chunks.append({
                "content": content,
                "embedding": embedding,
                "source": source,
                "type": chunk_type
            })

        return chunks

    @classmethod
    async def retrieve_context(cls, query: str, user: User, db: Session, k: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves the top k most semantically relevant context chunks (static KB guides and user logs)
        based on the user's query.
        """
        # 1. Fetch query embedding and candidate chunks concurrently
        query_emb_task = cls.get_embedding(query, is_query=True)
        kb_chunks_task = cls.load_kb_chunks()
        user_chunks_task = cls.get_user_history_chunks(user, db)

        query_emb, kb_chunks, user_chunks = await asyncio.gather(
            query_emb_task,
            kb_chunks_task,
            user_chunks_task
        )
        
        candidates = kb_chunks + user_chunks
        if not candidates:
            return []

        # 3. Compute cosine similarity for each chunk
        results = []
        for chunk in candidates:
            similarity = cls.cosine_similarity(query_emb, chunk["embedding"])
            results.append((similarity, chunk))

        # 4. Sort by score descending and pick top k
        results.sort(key=lambda x: x[0], reverse=True)
        top_k = results[:k]

        # Log retrieval details for debugging
        logger.info(f"RAG retrieved {len(top_k)} chunks for query: '{query}'")
        for i, (score, chunk) in enumerate(top_k):
            logger.info(f"  [{i+1}] (Score: {score:.3f}) [{chunk['type']}] {chunk['source']}")

        # Format and return list of matched chunks with similarity scores
        retrieved = []
        for score, chunk in top_k:
            retrieved.append({
                "content": chunk["content"],
                "source": chunk["source"],
                "type": chunk["type"],
                "score": float(score)
            })
        return retrieved
