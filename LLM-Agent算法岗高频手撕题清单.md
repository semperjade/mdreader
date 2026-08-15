# LLM / Agent 算法工程师 高频手撕题清单（2026 面经整理）

> 依据 2026 年各大厂面经（字节/阿里/腾讯/美团/智谱/DeepSeek/千问 等）整理。
> 考察趋势：从"背八股"转向"算法原理 + 工程实现 + 场景关联"，手撕题要求 **bug-free、能说清 shape、数值稳定性、复杂度**，PyTorch 和纯 NumPy 两种实现都要会。

---

## 一、经典算法题（"比 Hot100 更 Hot"）

面试中实际出现的高频题，**建议与大模型场景关联作答**：

| 题目 | 关联场景 |
|---|---|
| 数组中第 K 个最大元素（Top-K，**不能排序**）| 向量检索 TopK、重排 |
| 滑动窗口最大值（单调队列）| 长文本分窗处理、流式 token |
| 跳跃游戏 / 接雨水 / 山峰形最长子序列 | DP 基本功 |
| 和为 K 的子数组 | 通用 |
| 三数之和 / 括号生成 / 最大回文子串 | 通用 |
| 买卖股票（系列）| 通用 |
| 搜索插入位置 / 合并两个有序数组（原地）| 通用 |
| 螺旋数组第 N 个数 / 能被 3 整除的子集最大和 | 偏怪题型，偶尔出现 |
| 二叉树的层序遍历 / 岛屿数量（DFS/BFS）| 通用，Agent 面也考 |
| 最大乘积子数组（DP）| 通用 |

**刷题策略**：主攻 LeetCode Hot 100 + 剑指 Offer；重心从"偏难怪"转向**滑动窗口、Top-K、DP** 等能关联 LLM 场景的题。

---

## 二、LLM 核心算子手撕（**必考重头戏**）

### 2.1 Attention 系列（最重点 🔥🔥🔥）

- **Scaled Dot-Product Attention**：`softmax(QK^T/√d_k)V`，注意数值稳定（softmax 减 max）。
- **Multi-Head Attention（MHA）**：分头→计算→拼接→输出投影，说清张量 shape 变化。
- **Causal Mask**：下三角掩码，防止看到未来 token；写 MHA 时必带。
- **Cross Attention**：Q 来自 decoder，KV 来自 encoder。
- **GQA（分组查询注意力，LLaMA2 标配）**：关键是 `repeat_kv` 的广播逻辑。
- **MQA（多查询注意力）**：多头 Q 共享一组 KV。
- **Flash Attention**：tiled 分块 + 在线 Softmax，O(N) 内存（进阶）。
- **KV Cache**：缓存历史 KV 避免重算（推理优化核心）。

### 2.2 归一化

- LayerNorm / RMSNorm / BatchNorm：手写 + 讲区别（**大模型为何用 LayerNorm/RMSNorm 而非 BatchNorm**）。
- Pre-Norm vs Post-Norm。

### 2.3 位置编码

- **RoPE（旋转位置编码）**：重点，不要只背公式，要能写出旋转逻辑（复数乘法 / 奇偶索引处理）。
- Sinusoidal PE（sin/cos）、可学习 PE（BERT/GPT）、ALiBi。

### 2.4 采样与解码

- Greedy Decoding / Temperature（`logits/T`）/ Top-k / **Top-p（Nucleus）** / **Beam Search**（含长度惩罚）。

### 2.5 损失函数

- 交叉熵（梯度为 `p - y`）、LM Loss、KL 散度、MSE、Focal Loss、
- **SFT Loss**（Masked CE，只算 response 部分，含 shift right、屏蔽 prompt loss）、
- **Reward Model Loss**（`-log σ(r_w - r_l)`）、Contrastive Loss。

### 2.6 优化器

- SGD / SGD+Momentum / **Adam / AdamW**（解耦权重衰减，LLM 标配）/ LR Schedule（Warmup + Cosine）。

### 2.7 RLHF / 对齐（🔥 常考手推）

- REINFORCE（`∇log π × R`）、GAE（优势估计）、
- **PPO**（Clip ratio，RLHF 核心）、**DPO**（直接偏好优化，注意 reference 模型不更新）、**GRPO**（DeepSeek 用，group advantage 归一化）、
- KL Penalty、Reward Shaping。
- 高频追问：**手推 DPO 损失** `L = -log σ(β[log(πθ(yw)/πref(yw)) − log(πθ(yl)/πref(yl))])`，讲清 Bradley-Terry 模型来源、teacher forcing 只对 completion 累加 log-prob、KL 漂移监控。

### 2.8 高效训练 / 推理优化

- **LoRA**：低秩分解 `W + BA`，A 高斯初始化、B 全零初始化（及原因）。
- QLoRA（4-bit 量化）、Gradient Checkpointing、Mixed Precision、Gradient Accumulation。
- Paged Attention（vLLM 核心）、Speculative Decoding、Continuous Batching、Quantization（INT8/INT4）。

### 2.9 Transformer 架构组件

- Encoder-Only（BERT）/ Decoder-Only（GPT，**LLM 标准**）/ Encoder-Decoder（T5）。
- FFN（2 层 MLP 4 倍扩展）、**SwiGLU**（门控 FFN，LLaMA 标配）。
- 基础模型：Linear/Logistic Regression、Softmax、MLP、激活函数（ReLU/GELU/SiLU）、Gradient & Backprop、LSTM、CNN。

---

## 三、Agent / RAG 场景手撕（第二板块）

Agent 岗算法面越来越爱考**带 LLM 色彩的代码题**，甚至现场搭迷你系统：

### 3.1 Agent 核心

- **ReAct 循环**：Thought → Action → Observation，手写循环 + 工具调用 + 异常处理（常考）。
- **Tool Registry**：工具注册/查找/参数校验系统。
- **Memory 系统**：短期对话历史 + 长期向量检索（提取→embedding→向量库→召回→注入 prompt）。
- **Self-Reflection** 自我反思机制、CoT Prompting 实现。
- 多 Agent 协作编排（主从式 + 动态路由）。

### 3.2 RAG 链路

- 文档切块策略（固定大小/重叠/语义切块）。
- **混合检索**：BM25 + 向量检索融合（稀疏召回 vs 语义召回的边界与权重）。
- **Reranker 重排序**（交叉编码器）。
- Semantic Cache 语义缓存、HyDE 假设性文档嵌入、GraphRAG（多跳推理）。
- **Mini RAG 系统**：检索 + 生成 + 流式输出（90 分钟综合大题，字节/阿里常考）。

### 3.3 解码 / 评估

- **Beam Search**（含长度惩罚）、Top-K/Top-P 采样。
- BPE Tokenizer 实现。
- BLEU/ROUGE 评估、LLM-as-a-Judge 框架、Agent 任务成功率统计。

---

## 四、考察形式与答题要点

1. **双语言实现**：PyTorch 必考（所有大厂）；**纯 NumPy 实现**（字节、阿里算法岗）考察底层数学理解。
2. **说清 shape**：标注输入/输出/中间张量维度（如 `[batch, head, len, d_k]`），注释里标维度变化是加分项。
3. **数值稳定性**：softmax 减最大值、LogSoftmax 更稳、交叉熵梯度 `p - y`。
4. **复杂度**：能口头讲 Attention 的 `O(n²d)` 内存瓶颈及原因。
5. **时间控制**：基础算子约 10 分钟，Attention/Transformer 组件 20–30 分钟，ReAct/Memory 综合 45–90 分钟。
6. **理解设计动机**：不止背 API，要能答"RMSNorm 为什么收敛快""GQA 为什么省显存""缩放为什么防 softmax 饱和"。

---

## 五、优先级建议

**第一梯队（必练，几乎场场考）**
MHA（含 Causal Mask）· RoPE · LayerNorm/RMSNorm · KV Cache · Top-p/Temperature · AdamW · PPO/DPO/GRPO · LoRA · SFT Loss

**第二梯队（重点练）**
ReAct · Memory 系统 · 混合检索/重排 · Beam Search · BPE · Flash Attention（进阶）· Cross Entropy 手写

**第三梯队（根据岗位补充）**
GQA/MQA/MLA · Paged Attention · Quantization · GraphRAG · LLM-as-a-Judge

---

## 参考资源与一手面经

- [Junvate/LLM-Algorithm-Intern-Guide](https://github.com/Junvate/LLM-Algorithm-Intern-Guide) — 2026 届大模型算法岗实习面经，含 PPO/RoPE/Transformer 手撕、RLHF 八股
- [cdhx/LLM-Code-Hot-100](https://github.com/cdhx/LLM-Code-Hot-100) — LLM 时代 Hot 100，手撕代码社区投票排行
- [adongwanai/AgentGuide 编码题](https://github.com/adongwanai/AgentGuide/blob/main/docs/04-interview/04-coding-questions.md) — Agent 岗手撕题（ReAct/Tool Registry/Memory/RAG/Beam Search 等）
- [2026 技术面试新动向：大模型、算法岗高频真题](https://mtoutiao.xdf.cn/cet4-6/202602/15094499.html)
- [DeepSeek 大模型算法岗笔试面经（含答案）](https://api-cdn.nowcoder.com/discuss/913482312753418240)
- [LLM 算法岗 · 代码手撕 · 题目汇总与解析](https://www.cnblogs.com/moonout/p/19722167)
- [2026 Agent/大模型大厂面试题汇总：ReAct/Function Calling/MCP/RAG](https://notes.kamacoder.com/interview/llm/agent_interview.html)
- [【清华代码熊】近半年 Agent 面试高频题（26.04 版）](https://agent.csdn.net/6a7454d7662f9a54cb991143.html)
- [千问 C 端 Agent 算法日常实习一面面经](https://2aran.com/articles/research/topics/qwen-consumer-agent-algorithm-interview)
