import axios from "axios";
import { useEffect, useState } from "react";

interface Comment {
  id: number;
  content: string;
  user_name: string;
  created_at: string;
}

interface TicketCommentsProps {
  ticketId: number;
  currentUserId: number;
}

export default function TicketComments({ ticketId, currentUserId }: TicketCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch comments on mount or when ticketId changes
  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [ticketId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/comments/${ticketId}`);
      setComments(res.data);
    } catch (error) {
      // Optionally handle error
    }
    setLoading(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`/api/comments/${ticketId}`, {
        content: newComment,
        userId: currentUserId,
      });
      setComments([...comments, res.data]);
      setNewComment("");
    } catch (error) {
      // Optionally handle error
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow mt-6">
      <h2 className="text-lg font-bold mb-2">Comments</h2>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.length === 0 && <div className="text-gray-400">No comments yet.</div>}
          {comments.map((comment) => (
            <div key={comment.id} className="border-b pb-2">
              <div className="text-sm font-semibold">{comment.user_name || "User"}</div>
              <div className="text-gray-700">{comment.content}</div>
              <div className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          className="border rounded p-2 flex-1"
          rows={2}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
       <button
  className="bg-[#7B8794] hover:bg-[#7B8794] text-white rounded px-4 py-2"
  onClick={handleAddComment}
  disabled={!newComment.trim()}
>
  Comment
</button>
      </div>
    </div>
  );
}
